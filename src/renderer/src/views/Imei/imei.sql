CREATE TABLE IF NOT EXISTS `imei` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `imei` TEXT(250) NOT NULL,
  `estado` TEXT(250) NOT NULL,
  `fecha` TEXT(250) NOT NULL,
  `equipo` TEXT(250) NOT NULL,
  `proveedor` TEXT(250) NOT NULL,
  `id_equi` TEXT(250) NOT NULL,
  `fecha_venta` TEXT(250) NOT NULL,
  `hora_venta` TEXT(250) NOT NULL,
  `comprador` TEXT(250) NOT NULL,
  `detalles` TEXT(250) NOT NULL,
  `updated_at` TEXT(250) NOT NULL,
  `created_at` TEXT(250) NOT NULL,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);