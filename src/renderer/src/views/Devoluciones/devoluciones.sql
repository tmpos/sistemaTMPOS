CREATE TABLE IF NOT EXISTS `devoluciones` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `cantidad` TEXT(250) NOT NULL,
  `fecha` TEXT(250) NOT NULL,
  `hora` TEXT(250) NOT NULL,
  `turno` TEXT(250) NOT NULL,
  `cajero` TEXT(250) NOT NULL,
  `descripcion` TEXT(250) NOT NULL,
  `mes` TEXT(250) NOT NULL,
  `year` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);