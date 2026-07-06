CREATE TABLE IF NOT EXISTS `entradas` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `cajero` TEXT(250) NOT NULL,
  `cantidad` TEXT(250) NOT NULL,
  `fecha` TEXT(250) NOT NULL,
  `hora` TEXT(250) NOT NULL,
  `turno` TEXT(250) NOT NULL,
  `descripcion` TEXT(250) NOT NULL,
  `mes` TEXT(250) NOT NULL,
  `year` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);