CREATE TABLE IF NOT EXISTS `fabricacion` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `descripcion` TEXT(250) NOT NULL,
  `minimo` TEXT(250) NOT NULL,
  `blanco` TEXT(250) NOT NULL,
  `plata` TEXT(250) NOT NULL,
  `gris` TEXT(250) NOT NULL,
  `negro` TEXT(250) NOT NULL,
  `negro_texturizado` TEXT(250) NOT NULL,
  `madera` TEXT(250) NOT NULL,
  `inox` TEXT(250) NOT NULL,
  `roble` TEXT(250) NOT NULL,
  `otro` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `imagen` text(250) COLLATE utf8_spanish_ci NOT NULL,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);
