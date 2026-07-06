CREATE TABLE IF NOT EXISTS `paises` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `nombre` TEXT(250) NOT NULL,
  `moneda` TEXT(250) NOT NULL,
  `simbolo` TEXT(250) NOT NULL,
  `iso` TEXT(250) NOT NULL,
  `prefijo` TEXT(250) NOT NULL,
  `digitos` TEXT(250) NOT NULL,
  `nombre_imp` TEXT(250) NOT NULL,
  `c_imp` TEXT(250) NOT NULL,
  `idioma` TEXT(250) NOT NULL,
  `z_horaria` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);