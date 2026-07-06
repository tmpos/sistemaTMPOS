-- Tabla de premios para la ruleta
CREATE TABLE IF NOT EXISTS premios_ruleta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(500),
    color VARCHAR(7) NOT NULL DEFAULT '#FF6384',
    probabilidad INTEGER NOT NULL DEFAULT 10,
    activo INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ganadores de la ruleta
CREATE TABLE IF NOT EXISTS ganadores_ruleta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    no_factura VARCHAR(50) NOT NULL,
    nombre_cliente VARCHAR(255) NOT NULL,
    almacen VARCHAR(100),
    premio_ganado VARCHAR(255),
    premio_id INTEGER,
    fecha_participacion DATE NOT NULL,
    hora_participacion TIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (premio_id) REFERENCES premios_ruleta(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ganadores_no_factura ON ganadores_ruleta(no_factura);
CREATE INDEX IF NOT EXISTS idx_ganadores_fecha ON ganadores_ruleta(fecha_participacion);
CREATE INDEX IF NOT EXISTS idx_premios_activo ON premios_ruleta(activo);

-- Datos de ejemplo
INSERT INTO premios_ruleta (nombre, descripcion, color, probabilidad, activo) VALUES
('Premio 1: Descuento 10%', 'Obten un 10% de descuento en tu proxima compra', '#FF6384', 15, 1),
('Premio 2: Producto Gratis', 'Un producto gratis de nuestra seleccion', '#36A2EB', 10, 1),
('Premio 3: Descuento 20%', 'Obten un 20% de descuento en tu proxima compra', '#FFCE56', 8, 1),
('Premio 4: Vale $100', 'Vale de $100 para tu proxima compra', '#4BC0C0', 5, 1),
('Premio Especial', 'Premio sorpresa especial', '#9966FF', 3, 1);
