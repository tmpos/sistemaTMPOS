CREATE TABLE IF NOT EXISTS `entradasfijas` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `descripcion` TEXT(250) NOT NULL,
  `valor` TEXT(250) NOT NULL,
  `fecha_pago` TEXT(250) NOT NULL,
  `ultimo_pago` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);