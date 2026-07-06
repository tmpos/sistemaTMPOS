CREATE TABLE IF NOT EXISTS `ventasenproceso` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `cod_cliente` TEXT(250) NOT NULL,
  `nombre` TEXT(250) NOT NULL,
  `productos` TEXT(250) NOT NULL,
  `turno` TEXT(250) NOT NULL,
  `fecha` TEXT(250) NOT NULL,
  `token` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);