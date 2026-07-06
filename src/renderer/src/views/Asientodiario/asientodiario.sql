CREATE TABLE IF NOT EXISTS `asientodiario` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `numero` TEXT(250) NOT NULL,
  `fecha` TEXT(250) NOT NULL,
  `hora` TEXT(250) NOT NULL,
  `asiento` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);