CREATE TABLE IF NOT EXISTS `recibos` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `no_emision` TEXT(250) NOT NULL,
  `empresa` TEXT(250) NOT NULL,
  `fecha` TEXT(250) NOT NULL,
  `hora` TEXT(250) NOT NULL,
  `cantidad` TEXT(250) NOT NULL,
  `concepto` TEXT(250) NOT NULL,
  `pagadopor` TEXT(250) NOT NULL,
  `recibidopor` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);