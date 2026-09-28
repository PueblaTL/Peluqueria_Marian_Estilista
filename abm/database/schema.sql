CREATE TABLE IF NOT EXISTS roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE CHECK(CHAR_LENGTH(TRIM(nombre)) >= 1),
    descripcion VARCHAR(500) NOT NULL CHECK(CHAR_LENGTH(TRIM(descripcion)) >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL CHECK(CHAR_LENGTH(TRIM(nombre)) >= 1),
    apellido VARCHAR(80) NOT NULL CHECK(CHAR_LENGTH(TRIM(apellido)) >= 1),
    nickname VARCHAR(40) NOT NULL UNIQUE CHECK(CHAR_LENGTH(nickname) >= 3),
    email VARCHAR(254) NOT NULL UNIQUE,
    rol_id INT UNSIGNED NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Administración general del sistema.'),
('Operador', 'Gestión operativa de registros.'),
('Consulta', 'Consulta de información del sistema.')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
