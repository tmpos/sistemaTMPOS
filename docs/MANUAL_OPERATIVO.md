# Manual operativo interno

Este manual define como debe usarse el sistema en los flujos principales. La meta es reducir errores, mantener trazabilidad y dejar criterios claros para soporte.

## Roles sugeridos

- Administrador: configura empresa, usuarios, permisos, cajas, almacenes, precios, fiscalidad y puede autorizar anulaciones.
- Cajero: cobra ventas, abre/cierra caja, imprime documentos y registra pagos.
- Vendedor: crea ventas, cotizaciones, apartados y consulta inventario.
- Soporte: corrige datos tecnicos, ejecuta migraciones y ayuda en incidencias.

## Reglas generales

- No vender sin caja abierta.
- No editar documentos cerrados sin permiso de administrador.
- No usar productos de otro almacen en ventas del almacen actual.
- Toda anulacion, devolucion, cambio de IMEI, ajuste de inventario o uso de nota de credito debe quedar registrado en bitacora.
- Los documentos deben conservar estado: pendiente, cobrado, saldado, anulado, devuelto, usado o disponible segun aplique.

## Venta normal

1. Confirmar que la caja esta abierta.
2. Seleccionar cliente. Si no aplica cliente especifico, usar consumidor final.
3. Agregar productos desde el almacen actual.
4. Si el producto es celular, seleccionar IMEI disponible.
5. Validar precio, descuento, metodo de pago y comprobante fiscal si aplica.
6. Cobrar e imprimir factura o ticket.
7. Verificar que el stock/IMEI quede actualizado:
   - producto normal: descuenta cantidad.
   - celular: IMEI cambia a VENDIDO.
   - electrodomestico: serial cambia a VENDIDO.

## Cotizacion

1. Seleccionar cliente.
2. Agregar productos.
3. Confirmar vigencia y nota.
4. Guardar como cotizacion.
5. La cotizacion no debe descontar inventario.
6. Al convertirla a factura, validar stock actual antes de facturar.

## Pre-factura y orden

1. Crear desde la pantalla de venta cuando se requiere reservar informacion sin cobrar.
2. No deben descontar stock.
3. Al convertir a factura, validar stock, cliente, comprobante y metodo de pago.

## Apartado

1. Seleccionar cliente identificado.
2. Definir monto, abono y saldo.
3. Guardar apartado.
4. El apartado si descuenta stock cuando reserva mercancia.
5. Cada pago debe guardar fecha, hora, cajero, turno, metodo y saldo restante.
6. Al saldar, cambiar estado a SALDADO.

## Recibir equipo

1. Completar proveedor, equipo, marca, modelo, IMEI, costo y precio de venta.
2. Validar que el IMEI no exista como disponible.
3. Si el IMEI existe, solo reintegrar con autorizacion.
4. Registrar producto e IMEI con almacen actual.
5. Registrar compra o gasto segun metodo usado.
6. Si se genera nota de credito, debe nacer como DISPONIBLE.

## Nota de credito

1. Una nota nueva debe crearse como DISPONIBLE.
2. Al usarla en venta, el sistema debe:
   - aplicar el descuento.
   - cambiar estado a USADA.
   - guardar fecha_uso y hora_uso.
3. Una nota USADA no puede volver a aplicarse.
4. Si se revierte una factura donde se uso una nota, soporte debe evaluar si se reactiva manualmente la nota.

## Devolucion

1. Buscar factura original.
2. Validar estado de factura.
3. Confirmar productos a devolver.
4. Reintegrar stock o IMEI si aplica.
5. Cambiar factura a DEVOLUCION o generar registro de devolucion.
6. Registrar motivo y usuario responsable.

## Cuentas por cobrar

1. Toda factura a credito debe crear cuenta por cobrar.
2. Cada abono debe guardar:
   - numero de pago.
   - monto.
   - cajero.
   - fecha y hora.
   - metodo.
   - saldo resultante.
3. Si saldo llega a cero, marcar como SALDADO.

## Caja

1. Abrir caja al iniciar turno.
2. Registrar ingresos y egresos con concepto.
3. No cerrar caja sin revisar:
   - efectivo.
   - tarjeta.
   - transferencia.
   - gastos.
   - devoluciones.
4. Si hay diferencia, registrar motivo.
5. Caja cerrada no debe modificarse sin permiso.

## Inventario e IMEI

1. Todo IMEI debe tener estado y almacen.
2. Estados recomendados:
   - DISPONIBLE
   - VENDIDO
   - DEVOLUCION
   - GARANTIA
   - REPARACION
3. Los ajustes manuales deben guardar motivo y usuario.
4. El stock de celulares debe calcularse desde IMEI disponibles.

## Incidencias offline

1. Si no hay internet, vender solo con datos sincronizados.
2. Revisar cola de sincronizacion al volver internet.
3. No borrar cache sin respaldo.
4. Si hay duplicados, resolver por identificador unico y fecha de creacion.

## Cierre diario recomendado

1. Cerrar caja.
2. Revisar ventas por metodo de pago.
3. Revisar cuentas por cobrar creadas.
4. Revisar devoluciones y notas de credito usadas.
5. Generar backup.
6. Sincronizar datos pendientes.

