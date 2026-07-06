CREATE TABLE IF NOT EXISTS `proveedores` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT(250) NOT NULL,
  `rnc` TEXT(250) NOT NULL,
  `telefono` TEXT(250) NOT NULL,
  `email` TEXT(250) NOT NULL,
  `encargado` TEXT(250) NOT NULL,
  `cuenta_bancaria` TEXT(250) NOT NULL,
  `direccion` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);