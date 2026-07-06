CREATE TABLE IF NOT EXISTS `whatsapp` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT(250) NOT NULL,
  `cargo` TEXT(250) NOT NULL,
  `whatsapp` TEXT(250) NOT NULL,
  `otro` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `imagen` text(250) COLLATE utf8_spanish_ci NOT NULL,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);