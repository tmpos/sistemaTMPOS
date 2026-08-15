CREATE TABLE IF NOT EXISTS `cheques` (
  `id` int(11) AUTO_INCREMENT PRIMARY KEY,
  `numero_cheque` TEXT(250) NOT NULL,
  `banco` TEXT(250) NOT NULL,
  `cuenta_banco` TEXT(250) NOT NULL,
  `beneficiario` TEXT(250) NOT NULL,
  `cuenta_debito_id` TEXT(250),
  `cuenta_debito_nombre` TEXT(250),
  `monto` TEXT(250) NOT NULL,
  `fecha_emision` TEXT(250) NOT NULL,
  `fecha_cobro` TEXT(250),
  `concepto` TEXT(250) NOT NULL,
  `estado` TEXT(250) NOT NULL,
  `usuario` TEXT(250) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
