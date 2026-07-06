CREATE TABLE IF NOT EXISTS `printerconfig` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT(250) NOT NULL,
  `configuraciones` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);