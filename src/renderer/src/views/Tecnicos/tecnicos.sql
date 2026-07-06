CREATE TABLE IF NOT EXISTS `tecnicos` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT(250) NOT NULL,
  `telefono` TEXT(250) NOT NULL,
  `whatsapp` TEXT(250) NOT NULL,
  `email` TEXT(250) NOT NULL,
  `fecha_inicio` TEXT(250) NOT NULL,
  `direccion` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);