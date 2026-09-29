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
    password_hash VARCHAR(255) NULL,
    intentos INT NOT NULL DEFAULT 0,
    bloqueado_hasta DATETIME NULL,
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
    clave VARCHAR(40) NULL UNIQUE,
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
    clave VARCHAR(40) NULL UNIQUE,
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
    ('Usuario', 'Cuenta de cliente del portal.'),
    ('Consulta',      'Solo lectura de informacion del sistema.');

-- Catálogo de Aura Studio: claves públicas estables, independientes de IDs MySQL.
INSERT INTO profesionales (clave,nombre,titulo,especialidad,descripcion,imagen,activo) SELECT 'prof-1','Valeria Benítez','Directora Creativa & Master Colorist','Balayage, Colorimetría de Vanguardia y Visagismo','Líder del equipo técnico de Aura Studio. Especialista en visagismo y diseño de iluminación europea a mano alzada. Su pasión es crear tonalidades armoniosas que realcen las facciones y cuiden la salud del cabello.','assets/images/equipo_valeria.jpg',1 WHERE NOT EXISTS (SELECT 1 FROM profesionales WHERE clave='prof-1');
INSERT INTO profesionales (clave,nombre,titulo,especialidad,descripcion,imagen,activo) SELECT 'prof-2','Mariano Echavarria','Estilista Senior & Diseñador de Cortes','Cortes de Autor, Visagismo y Texturizado','Especialista en cortes vanguardistas adaptados a la morfología facial y estilo de vida. Experto en técnicas de corte en seco y peinado de alta durabilidad.','assets/images/equipo_lucas.jpg',1 WHERE NOT EXISTS (SELECT 1 FROM profesionales WHERE clave='prof-2');
INSERT INTO profesionales (clave,nombre,titulo,especialidad,descripcion,imagen,activo) SELECT 'prof-3','Sofía Carrizo','Especialista en Rubios & Babylights','Microiluminación, Babylights y Tonos Fríos','Dedicada a la creación de rubios luminosos y dimensionales. Trabaja con fórmulas orgánicas y protectores de enlaces capilares para un rubio radiante y sin daño.','assets/images/equipo_sofia.jpg',1 WHERE NOT EXISTS (SELECT 1 FROM profesionales WHERE clave='prof-3');
INSERT INTO profesionales (clave,nombre,titulo,especialidad,descripcion,imagen,activo) SELECT 'prof-4','Camila Navarro','Terapeuta Capilar & Peinados de Gala','Alisados Láser 6D, Botox Capilar y Peinados de Novia','Especializada en salud capilar intensiva, alineación de fibra y peinados sofisticados para eventos, quinceañeras y celebraciones especiales.','assets/images/equipo_camila.jpg',1 WHERE NOT EXISTS (SELECT 1 FROM profesionales WHERE clave='prof-4');
INSERT INTO servicios (clave,nombre,categoria,descripcion,precio_desde,precio_hasta,duracion_minutos,imagen,activo) SELECT 'srv-1','Alisado Láser 6D','Alisados','Técnica avanzada de alisado y disciplina capilar. Incluye tratamiento termoactivo, sellado de la fibra, reducción del frizz y acabado ultra liso con brillo intenso.',150000,NULL,150,'assets/images/alisado_6d.webp',1 WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE clave='srv-1');
INSERT INTO servicios (clave,nombre,categoria,descripcion,precio_desde,precio_hasta,duracion_minutos,imagen,activo) SELECT 'srv-2','Mechas Balayage','Iluminación','Técnica francesa de iluminación degradada a mano alzada. Incluye matización personalizada, baño de luz gloss, tratamiento nutritivo y peinado con ondas.',95000,NULL,180,'assets/images/mechas_balayage_2.png',1 WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE clave='srv-2');
INSERT INTO servicios (clave,nombre,categoria,descripcion,precio_desde,precio_hasta,duracion_minutos,imagen,activo) SELECT 'srv-3','Mechas Localizadas','Iluminación','Técnica de iluminación estratégica para realzar zonas específicas del cabello y potenciar los rasgos del rostro. Incluye aclaración personalizada, matización tonal, tratamiento nutritivo y peinado.',85000,NULL,120,'assets/images/mechas_localizadas_2.png',1 WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE clave='srv-3');
INSERT INTO servicios (clave,nombre,categoria,descripcion,precio_desde,precio_hasta,duracion_minutos,imagen,activo) SELECT 'srv-4','Mechas Babylight','Iluminación','Técnica de iluminación ultrafina inspirada en los reflejos naturales del cabello. Incluye aclaración delicada, matización personalizada, baño de luz gloss, tratamiento nutritivo y peinado.',88000,NULL,150,'assets/images/mechas_babylight_2.jpg',1 WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE clave='srv-4');
INSERT INTO servicios (clave,nombre,categoria,descripcion,precio_desde,precio_hasta,duracion_minutos,imagen,activo) SELECT 'srv-5','Peinados para Eventos','Peinados','Peinados personalizados para quinceañeras, bodas, fiestas, celebraciones y ocasiones especiales. Diseños pensados para complementar el estilo, el vestido y la personalidad de cada clienta.',48000,NULL,60,'assets/images/peinados_1.jpeg',1 WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE clave='srv-5');

-- =============================================================
-- NOTAS
-- Las validaciones de solapamiento, horario y formato se
-- realizan en la capa de aplicacion (Reservas.php).
-- Los CHECK/FK garantizan integridad referencial en la BD.
-- No se incluyen contrasenas de ejemplo; el admin debe
-- crearse con password_hash() desde el setup del ABM.
-- La academia/cursos fue eliminada del alcance del proyecto.
-- =============================================================

-- Demo sin contraseña conocida; el acceso controlado se realiza por POST.
INSERT INTO usuarios (nombre,apellido,nickname,email,rol_id,password_hash) SELECT 'Administrador','Demo','admin_demo','admin@aurastudio.local',id,'$2y$10$0VfsuOXiDW6U7Ql7BDrNW.IJuS4jz/jOFB68o/BC9HaQoxQVaATfe' FROM roles WHERE nombre='Administrador';
