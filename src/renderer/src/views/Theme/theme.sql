CREATE TABLE IF NOT EXISTS `theme` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `preset` TEXT(250) NOT NULL,
  `primary` TEXT(250) NOT NULL,
  `surface` TEXT(250) NOT NULL,
  `darktheme` TEXT(250) NOT NULL,
  `menumode` TEXT(250) NOT NULL,
  `tipo` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `usuario` text(250) COLLATE utf8_spanish_ci NOT NULL
);