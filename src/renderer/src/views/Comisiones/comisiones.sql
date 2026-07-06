CREATE TABLE IF NOT EXISTS `comisionesbancarias` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `numero_comprobante` TEXT(250) NOT NULL,
  `banco` TEXT(250) NOT NULL,
  `cuenta_banco` TEXT(250) NOT NULL,
  `tipo_comision` TEXT(250) NOT NULL,
  `monto` TEXT(250) NOT NULL,
  `fecha` TEXT(250) NOT NULL,
  `periodo` TEXT(250),
  `descripcion` TEXT(250) NOT NULL,
  `estado` TEXT(250) NOT NULL,
  `usuario` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
