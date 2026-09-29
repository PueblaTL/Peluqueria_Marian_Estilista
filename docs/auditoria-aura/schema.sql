-- PROPUESTA: NO APLICADA. MySQL 8.0.16+.
-- Solo para una base NUEVA y VACIA seleccionada expresamente por quien la ejecute.
-- No contiene DROP, ALTER, USE ni CREATE DATABASE; no sustituye al instalador actual.
-- CREATE sin IF NOT EXISTS evita ocultar incompatibilidades con tablas existentes.
-- DDL hace commit implicito: una ejecucion fallida puede dejar tablas parciales.
-- Ver diagnostico.md: requiere adaptacion de PHP/JS y migracion de IDs.
SET NAMES utf8mb4;

CREATE TABLE administradores (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    intentos INT NOT NULL DEFAULT 0,
    bloqueado_hasta DATETIME NULL,
    CONSTRAINT ck_admin_unico CHECK (id = 1),
    CONSTRAINT ck_admin_intentos CHECK (intentos >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    descripcion VARCHAR(500) NOT NULL,
    CONSTRAINT ck_rol_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) >= 1),
    CONSTRAINT ck_rol_descripcion CHECK (CHAR_LENGTH(TRIM(descripcion)) >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    nickname VARCHAR(40) NOT NULL UNIQUE,
    email VARCHAR(254) NOT NULL UNIQUE,
    rol_id INT UNSIGNED NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_usuario_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) >= 1),
    CONSTRAINT ck_usuario_apellido CHECK (CHAR_LENGTH(TRIM(apellido)) >= 1),
    CONSTRAINT ck_usuario_nickname CHECK (CHAR_LENGTH(nickname) >= 3),
    INDEX idx_usuario_rol (rol_id),
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profesionales (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL,
    CONSTRAINT ck_profesional_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE servicios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    descripcion TEXT NOT NULL,
    precio_desde DECIMAL(10,2) NOT NULL,
    precio_hasta DECIMAL(10,2) NULL,
    duracion_minutos SMALLINT UNSIGNED NOT NULL,
    imagen VARCHAR(500) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_servicio_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) >= 1),
    CONSTRAINT ck_servicio_precio CHECK (precio_desde >= 0 AND (precio_hasta IS NULL OR precio_hasta >= precio_desde)),
    CONSTRAINT ck_servicio_duracion CHECK (duracion_minutos > 0),
    CONSTRAINT ck_servicio_activo CHECK (activo IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reservas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profesional_id INT UNSIGNED NOT NULL,
    servicio_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    duracion_minutos SMALLINT UNSIGNED NOT NULL,
    precio_estimado DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    cliente_nombre VARCHAR(80) NOT NULL,
    cliente_apellido VARCHAR(80) NOT NULL,
    cliente_email VARCHAR(254) NOT NULL,
    cliente_telefono VARCHAR(40) NOT NULL,
    observaciones TEXT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_reserva_duracion CHECK (duracion_minutos > 0),
    CONSTRAINT ck_reserva_precio CHECK (precio_estimado >= 0),
    CONSTRAINT ck_reserva_hora CHECK (hora >= '00:00:00' AND hora < '24:00:00'),
    CONSTRAINT ck_reserva_estado CHECK (estado IN ('Pendiente','Confirmado','Cancelado','Completado')),
    CONSTRAINT ck_reserva_nombre CHECK (CHAR_LENGTH(TRIM(cliente_nombre)) >= 1),
    CONSTRAINT ck_reserva_apellido CHECK (CHAR_LENGTH(TRIM(cliente_apellido)) >= 1),
    INDEX idx_reserva_agenda (profesional_id, fecha, hora),
    INDEX idx_reserva_servicio (servicio_id),
    CONSTRAINT fk_reserva_profesional FOREIGN KEY (profesional_id) REFERENCES profesionales(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_reserva_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cursos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL,
    CONSTRAINT ck_curso_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inscripciones (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    curso_id INT UNSIGNED NOT NULL,
    nombre_completo VARCHAR(160) NOT NULL,
    email VARCHAR(254) NOT NULL,
    telefono VARCHAR(40) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_inscripcion_nombre CHECK (CHAR_LENGTH(TRIM(nombre_completo)) >= 1),
    CONSTRAINT ck_inscripcion_estado CHECK (estado IN ('Pendiente','Contactado','Inscripto')),
    INDEX idx_inscripcion_curso (curso_id),
    CONSTRAINT fk_inscripcion_curso FOREIGN KEY (curso_id) REFERENCES cursos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catalogo requerido por el ABM existente. No se crean cuentas ni passwords de ejemplo.
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Administración general del sistema.'),
('Operador', 'Gestión operativa de registros.'),
('Consulta', 'Consulta de información del sistema.');

-- La aplicacion debe validar email/telefono, longitudes, fecha real y futura,
-- horarios de apertura y solapamientos dentro de una transaccion.
-- Estos CHECK/FK no sustituyen esas reglas ni implementan autorizacion por rol.
