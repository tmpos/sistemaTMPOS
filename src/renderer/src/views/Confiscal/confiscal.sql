CREATE TABLE IF NOT EXISTS `confiscal` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT(250) NOT NULL,
  `prefijo` TEXT(250) NOT NULL,
  `secuencia` TEXT(250) NOT NULL,
  `aprobados` TEXT(250) NOT NULL,
  `fecha` TEXT(250) NOT NULL,
  `expiracion` TEXT(250) NOT NULL,
  `contador` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);