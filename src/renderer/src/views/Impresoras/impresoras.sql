CREATE TABLE IF NOT EXISTS `impresoras` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT(250) NOT NULL,
  `fontsize` TEXT(250) NOT NULL,
  `backgroundsize` TEXT(250) NOT NULL,
  `barwidth` TEXT(250) NOT NULL,
  `barheght` TEXT(250) NOT NULL,
  `codesize` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);