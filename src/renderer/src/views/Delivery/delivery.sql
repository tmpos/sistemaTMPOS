CREATE TABLE IF NOT EXISTS `delivery` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT(250) NOT NULL,
  `cedula` TEXT(250) NOT NULL,
  `telefono` TEXT(250) NOT NULL,
  `direccion` TEXT(250) NOT NULL,
  `codigo` TEXT(250) NOT NULL,
  `porcentaje` TEXT(250) NOT NULL,
  `activo` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);