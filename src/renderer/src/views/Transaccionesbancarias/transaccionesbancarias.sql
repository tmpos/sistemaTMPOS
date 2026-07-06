CREATE TABLE IF NOT EXISTS `transaccionesbancarias` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `cuenta` TEXT(250) NOT NULL,
  `monto` TEXT(250) NOT NULL,
  `tipo` TEXT(250) NOT NULL,
  `balance_anterior` TEXT(250) NOT NULL,
  `balance_actual` TEXT(250) NOT NULL,
  `metodo` TEXT(250) NOT NULL,
  `descripcion` TEXT(250) NOT NULL,
  `persona` TEXT(250) NOT NULL,
  `fecha` TEXT(250) NOT NULL,
  `hora` TEXT(250) NOT NULL,
  `estado` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);