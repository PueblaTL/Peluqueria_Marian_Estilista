-- =============================================================
-- Aura Studio  Schema de base de datos
-- Motor: MySQL 5.7+ / MariaDB 10.4+  |  Charset: utf8mb4
-- =============================================================

CREATE DATABASE IF NOT EXISTS aura_studio
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE aura_studio;

SET NAMES utf8mb4;

-- -------------------------------------------------------------
-- Tabla: administradores
-- Un unico registro (id=1) para el panel ABM.
-- -------------------------------------------------------------
CREATE TABLE administradores (
    id              TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    email           VARCHAR(254)     NOT NULL UNIQUE,
    password_hash   VARCHAR(255)     NOT NULL,
    intentos        INT              NOT NULL DEFAULT 0,
    bloqueado_hasta DATETIME         NULL,
    CONSTRAINT ck_admin_unico    CHECK (id = 1),
    CONSTRAINT ck_admin_intentos CHECK (intentos >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Tabla: roles
-- Perfiles de acceso para los usuarios del ABM.
-- -------------------------------------------------------------
CREATE TABLE roles (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(80)  NOT NULL UNIQUE,
    descripcion VARCHAR(500) NOT NULL,
    CONSTRAINT ck_rol_nombre       CHECK (CHAR_LENGTH(TRIM(nombre))      >= 1),
    CONSTRAINT ck_rol_descripcion  CHECK (CHAR_LENGTH(TRIM(descripcion)) >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Tabla: usuarios
-- Cuentas de operadores del panel ABM.
-- -------------------------------------------------------------
CREATE TABLE usuarios (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(80)  NOT NULL,
    apellido   VARCHAR(80)  NOT NULL,
    nickname   VARCHAR(40)  NOT NULL UNIQUE,
    email      VARCHAR(254) NOT NULL UNIQUE,
    rol_id     INT UNSIGNED NOT NULL,
    creado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_usuario_nombre    CHECK (CHAR_LENGTH(TRIM(nombre))   >= 1),
    CONSTRAINT ck_usuario_apellido  CHECK (CHAR_LENGTH(TRIM(apellido)) >= 1),
    CONSTRAINT ck_usuario_nickname  CHECK (CHAR_LENGTH(nickname)       >= 3),
    INDEX idx_usuario_rol (rol_id),
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Tabla: profesionales
-- Estilistas y profesionales del salon.
-- -------------------------------------------------------------
CREATE TABLE profesionales (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(160) NOT NULL,
    titulo       VARCHAR(160) NOT NULL DEFAULT '',
    especialidad VARCHAR(160) NOT NULL DEFAULT '',
    descripcion  TEXT         NOT NULL,
    imagen       VARCHAR(500) NOT NULL DEFAULT '',
    activo       BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_profesional_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Tabla: servicios
-- Catalogo de servicios del salon con precios y duracion.
-- -------------------------------------------------------------
CREATE TABLE servicios (
    id                INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
    nombre            VARCHAR(160)      NOT NULL,
    categoria         VARCHAR(80)       NOT NULL,
    descripcion       TEXT              NOT NULL,
    precio_desde      DECIMAL(10,2)     NOT NULL,
    precio_hasta      DECIMAL(10,2)     NULL,
    duracion_minutos  SMALLINT UNSIGNED NOT NULL,
    imagen            VARCHAR(500)      NOT NULL,
    activo            BOOLEAN           NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_servicio_nombre    CHECK (CHAR_LENGTH(TRIM(nombre)) >= 1),
    CONSTRAINT ck_servicio_precio    CHECK (precio_desde >= 0 AND (precio_hasta IS NULL OR precio_hasta >= precio_desde)),
    CONSTRAINT ck_servicio_duracion  CHECK (duracion_minutos > 0),
    CONSTRAINT ck_servicio_activo    CHECK (activo IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Tabla: reservas
-- Turnos agendados por clientes desde el portal web.
-- -------------------------------------------------------------
CREATE TABLE reservas (
    id                INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
    profesional_id    INT UNSIGNED      NOT NULL,
    servicio_id       INT UNSIGNED      NOT NULL,
    fecha             DATE              NOT NULL,
    hora              TIME              NOT NULL,
    duracion_minutos  SMALLINT UNSIGNED NOT NULL,
    precio_estimado   DECIMAL(10,2)     NOT NULL,
    estado            VARCHAR(20)       NOT NULL DEFAULT 'Pendiente',
    cliente_nombre    VARCHAR(80)       NOT NULL,
    cliente_apellido  VARCHAR(80)       NOT NULL,
    cliente_email     VARCHAR(254)      NOT NULL,
    cliente_telefono  VARCHAR(40)       NOT NULL,
    observaciones     TEXT              NULL,
    creado_en         TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_reserva_duracion  CHECK (duracion_minutos > 0),
    CONSTRAINT ck_reserva_precio    CHECK (precio_estimado >= 0),
    CONSTRAINT ck_reserva_estado    CHECK (estado IN ('Pendiente','Confirmado','Cancelado','Completado')),
    CONSTRAINT ck_reserva_nombre    CHECK (CHAR_LENGTH(TRIM(cliente_nombre))   >= 1),
    CONSTRAINT ck_reserva_apellido  CHECK (CHAR_LENGTH(TRIM(cliente_apellido)) >= 1),
    INDEX idx_reserva_agenda   (profesional_id, fecha, hora),
    INDEX idx_reserva_servicio (servicio_id),
    CONSTRAINT fk_reserva_profesional FOREIGN KEY (profesional_id) REFERENCES profesionales(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_reserva_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- DATOS INICIALES
-- =============================================================

-- Roles del sistema ABM
INSERT INTO roles (nombre, descripcion) VALUES
    ('Administrador', 'Acceso completo al sistema de administracion.'),
    ('Operador',      'Gestion de reservas, servicios y profesionales.'),
    ('Consulta',      'Solo lectura de informacion del sistema.');

-- Profesionales del salon
INSERT INTO profesionales (nombre, titulo, especialidad, descripcion, imagen, activo) VALUES
    ('Marian Lopez',  'Estilista Senior',   'Colorimetria y cortes modernos',
     'Con mas de 10 anos de experiencia, Marian es especialista en colorimetria y tecnicas de balayage.',
     'assets/profesionales/marian.jpg', TRUE),
    ('Carla Diaz',    'Tecnica en Belleza', 'Peinados y tratamientos capilares',
     'Carla es experta en peinados de fiesta y tratamientos de hidratacion y keratina.',
     'assets/profesionales/carla.jpg',  TRUE),
    ('Sofia Romero',  'Estilista',          'Cortes y alisados',
     'Sofia se especializa en cortes femeninos modernos y tratamientos de alisado brasileno.',
     'assets/profesionales/sofia.jpg',  TRUE);

-- Servicios del catalogo
INSERT INTO servicios (nombre, categoria, descripcion, precio_desde, precio_hasta, duracion_minutos, imagen, activo) VALUES
    ('Corte de cabello',        'Cabello',    'Corte personalizado adaptado a tu forma de rostro y estilo de vida.',             4500.00,  NULL,     45,  'assets/servicios/corte.jpg',       TRUE),
    ('Coloracion completa',     'Cabello',    'Coloracion de raiz a puntas con pigmentos de alta duracion.',                     12000.00, 18000.00, 90,  'assets/servicios/color.jpg',       TRUE),
    ('Balayage y Mechas',       'Cabello',    'Tecnica de iluminacion degradada para un efecto natural y luminoso.',             15000.00, 22000.00, 120, 'assets/servicios/balayage.jpg',    TRUE),
    ('Tratamiento de keratina', 'Tratamiento','Alisado progresivo que elimina el frizz y aporta brillo por hasta 3 meses.',     18000.00, NULL,     120, 'assets/servicios/keratina.jpg',    TRUE),
    ('Hidratacion profunda',    'Tratamiento','Mascarilla nutritiva de alta penetracion para cabellos secos y danados.',         6000.00,  NULL,     60,  'assets/servicios/hidratacion.jpg', TRUE),
    ('Peinado y brushing',      'Peinado',    'Secado y moldeado profesional con plancha o rulo para cualquier ocasion.',       5000.00,  8000.00,  60,  'assets/servicios/peinado.jpg',     TRUE),
    ('Peinado de fiesta',       'Peinado',    'Peinado elaborado para eventos especiales, bodas o quinceaneras.',               12000.00, 20000.00, 90,  'assets/servicios/fiesta.jpg',      TRUE),
    ('Manicura',                'Unas',       'Moldeado, limpieza de cuticulas y esmaltado de unas de las manos.',              3500.00,  NULL,     45,  'assets/servicios/manicura.jpg',    TRUE),
    ('Pedicura',                'Unas',       'Tratamiento completo de unas de los pies con exfoliacion y esmaltado.',          4000.00,  NULL,     60,  'assets/servicios/pedicura.jpg',    TRUE),
    ('Depilacion facial',       'Estetica',   'Depilacion de cejas, labio superior y menton con hilo o cera.',                 2500.00,  NULL,     30,  'assets/servicios/depilacion.jpg',  TRUE);

-- =============================================================
-- NOTAS
-- Las validaciones de solapamiento, horario y formato se
-- realizan en la capa de aplicacion (Reservas.php).
-- Los CHECK/FK garantizan integridad referencial en la BD.
-- No se incluyen contrasenas de ejemplo; el admin debe
-- crearse con password_hash() desde el setup del ABM.
-- La academia/cursos fue eliminada del alcance del proyecto.
-- =============================================================
