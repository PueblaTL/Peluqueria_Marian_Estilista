-- ==============================================================================
-- SEED DATA: marian_estilista
-- Datos de inicializacion - Compatible con entorno local y produccion
-- Ejecutar DESPUES de schema.sql
-- ==============================================================================

USE `marian_estilista`;

-- ==============================================================================
-- LIMPIEZA DE CUENTAS DE DEMOSTRACION (si existen)
-- Solo desactiva por email - NO hace DELETE ni TRUNCATE.
-- Los usuarios reales creados por clientes NO se ven afectados.
-- ==============================================================================
UPDATE `usuarios`
SET
    `activo`             = 0,
    `password`           = '$2y$10$DISABLED_DEMO_ACCOUNT_INVALID_HASH_FOR_PRODUCTION00000',
    `token_verificacion` = NULL,
    `token_expiracion`   = NULL,
    `updated_at`         = NOW()
WHERE `email` IN (
    'admin@marianestilista.com',
    'camila@gmail.com',
    'valentina@gmail.com'
);

-- ==============================================================================
-- CUENTA ADMINISTRADOR DE PRODUCCION
--
-- IMPORTANTE: Este INSERT usa un hash temporal de marcador.
-- El hash real se genera via:
--   backend/config/setup_production_admin.php
-- Ejecutar ese script DESPUES de este seed para activar la cuenta
-- con hash BCRYPT valido generado por password_hash().
-- La contrasena en texto plano NO aparece en este archivo.
-- ==============================================================================
INSERT INTO `usuarios` (
    `nombre`,
    `apellido`,
    `email`,
    `password`,
    `telefono`,
    `rol`,
    `email_verificado`,
    `token_verificacion`,
    `token_expiracion`,
    `ultimo_reenvio_correo`,
    `activo`,
    `created_at`,
    `updated_at`
) VALUES (
    'Jesus',
    'Echavarria',
    'jesusechavarria@marianestilista.online',
    '$2y$10$PLACEHOLDER_MUST_RUN_setup_production_admin.phpXXXXXXXX',
    '2944000000',
    'ADMIN',
    1,
    NULL,
    NULL,
    NULL,
    1,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    `nombre`             = VALUES(`nombre`),
    `apellido`           = VALUES(`apellido`),
    `rol`                = 'ADMIN',
    `email_verificado`   = 1,
    `activo`             = 1,
    `token_verificacion` = NULL,
    `token_expiracion`   = NULL,
    `updated_at`         = NOW();
-- NOTA: El campo `password` NO se actualiza aqui - setup_production_admin.php lo hace.

-- ==============================================================================
-- PROFESIONAL: Mariano (unico profesional del salon)
-- ==============================================================================
INSERT INTO `profesionales` (`nombre`, `apellido`, `especialidad`, `descripcion`, `imagen`, `activo`) VALUES
(
    'Mariano',
    'Reyes',
    'Colorimetria, Balayage & Peinados Creativos',
    'Estilista profesional con mas de 10 anos de experiencia en colorimetria avanzada, tecnicas de iluminacion balayage y peinados de novia.',
    'assets/images/profesional_mariano.webp',
    1
)
ON DUPLICATE KEY UPDATE `especialidad` = VALUES(`especialidad`);

-- ==============================================================================
-- CATALOGO DE SERVICIOS
-- ==============================================================================
INSERT INTO `servicios` (`nombre`, `categoria`, `descripcion`, `precio`, `precio_texto`, `duracion_minutos`, `imagen`, `destacado`, `activo`, `detalles`) VALUES
(
    'Alisado Laser 6D',
    'Alisados',
    'Tecnica avanzada de alisado y disciplina capilar. Incluye tratamiento termoactivo, sellado de la fibra, reduccion del frizz y acabado ultra liso con brillo intenso.',
    150000.00, '$150.000 a $180.000', 150,
    'assets/images/alisado_6d.webp', 1, 1, NULL
),
(
    'Mechas Balayage',
    'Iluminacion',
    'Iluminacion personalizada con efecto degradado y luminoso, disenada para aportar dimension, movimiento y un resultado natural y sofisticado.',
    150000.00, '$150.000 a $180.000', 180,
    'assets/images/mechas_balayage_2.webp', 1, 1, NULL
),
(
    'Mechas Localizadas',
    'Iluminacion',
    'Tecnica personalizada que aporta luminosidad y dimension en zonas estrategicas del cabello, resaltando las facciones del rostro.',
    150000.00, '$150.000 a $180.000', 120,
    'assets/images/mechas_localizadas_2.webp', 1, 1, NULL
),
(
    'Mechas Babylight',
    'Iluminacion',
    'Mechas finas y personalizadas que crean una iluminacion natural, delicada y luminosa.',
    150000.00, '$150.000 a $180.000', 150,
    'assets/images/mechas_babylight_2.webp', 1, 1, NULL
),
(
    'Peinados para Eventos',
    'Peinados',
    'Peinados personalizados para quinceanieras, bodas y ocasiones especiales.',
    30000.00, 'Desde $30.000', 60,
    'assets/images/peinados_1.webp', 0, 0, NULL
),
(
    'Ondas / Brushing con ondas',
    'Peinados',
    'Brushing con ondas suaves y definidas para lograr un acabado elegante, natural y con movimiento.',
    30000.00, '$30.000', 60,
    'assets/images/peinados/peinado_ondas.webp', 1, 1, NULL
),
(
    'Semirrecogido',
    'Peinados',
    'Peinado elegante que combina el cabello suelto con secciones recogidas.',
    40000.00, '$40.000', 60,
    'assets/images/peinados/peinado_semirrecogido.webp', 1, 1, NULL
),
(
    'Recogido',
    'Peinados',
    'Peinado completamente recogido, disenado para lograr un look sofisticado y duradero.',
    50000.00, '$50.000', 60,
    'assets/images/peinados/peinado_recogido.webp', 1, 1, NULL
),
(
    'Peinado social / fiesta',
    'Peinados',
    'Peinado personalizado para fiestas y eventos, adaptado al estilo, vestido y ocasion de cada clienta.',
    55000.00, '$55.000', 60,
    'assets/images/peinados/peinado_social.webp', 1, 1, NULL
),
(
    'Peinado 15 anos',
    'Peinados',
    'Peinado especialmente disenado para celebraciones de 15 anos.',
    65000.00, '$65.000', 90,
    'assets/images/peinados/peinado_15anios.webp', 1, 1, NULL
),
(
    'Peinado de novia',
    'Peinados',
    'Peinado personalizado para novias. El precio es desde $80.000 y puede variar segun la complejidad del trabajo.',
    80000.00, 'Desde $80.000', 90,
    'assets/images/peinados/peinado_novia.webp', 1, 1, NULL
),
(
    'Prueba de peinado',
    'Peinados',
    'Prueba previa para definir y ajustar el peinado elegido antes del evento.',
    35000.00, '$35.000', 60,
    'assets/images/peinados/peinado_prueba.webp', 1, 1, NULL
)
ON DUPLICATE KEY UPDATE
    `categoria`         = VALUES(`categoria`),
    `descripcion`       = VALUES(`descripcion`),
    `precio`            = VALUES(`precio`),
    `precio_texto`      = VALUES(`precio_texto`),
    `duracion_minutos`  = VALUES(`duracion_minutos`),
    `imagen`            = VALUES(`imagen`),
    `destacado`         = VALUES(`destacado`),
    `activo`            = VALUES(`activo`),
    `detalles`          = VALUES(`detalles`);

-- ==============================================================================
-- PASO OBLIGATORIO POST-SEED
-- ==============================================================================
-- Despues de ejecutar este archivo, correr el script PHP:
--   Via HTTP: https://marianestilista.online/backend/config/setup_production_admin.php
--   Via CLI:  php backend/config/setup_production_admin.php
-- Ese script genera el hash BCRYPT real con password_hash() y lo aplica.
-- Eliminarlo o moverlo fuera del webroot una vez ejecutado.
-- ==============================================================================
