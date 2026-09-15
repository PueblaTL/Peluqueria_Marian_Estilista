-- ==============================================================================
-- SEED DATA: marian_estilista
-- Datos iniciales de prueba para entorno local (XAMPP / Laragon)
-- Ejecutar DESPUÉS de schema.sql
-- ==============================================================================

USE `marian_estilista`;

-- ------------------------------------------------------------------------------
-- USUARIOS DE PRUEBA
-- Contraseñas hasheadas con bcrypt (password_hash):
--   Admin:   Admin123!
--   Cliente: Cliente123!
-- ------------------------------------------------------------------------------
INSERT INTO `usuarios` (`nombre`, `apellido`, `email`, `password`, `telefono`, `rol`, `activo`) VALUES
(
    'Marian',
    'Admin',
    'admin@marianestilista.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin123!
    '2944000001',
    'ADMIN',
    1
),
(
    'Camila',
    'González',
    'camila@gmail.com',
    '$2y$12$tzJRdMQh0GRuEqEbLXGVy.z3a6f8dZ08d0ANnUCsj7fVuVDCZJFLW', -- Cliente123!
    '2944123456',
    'CLIENTE',
    1
),
(
    'Valentina',
    'Rodríguez',
    'valentina@gmail.com',
    '$2y$12$tzJRdMQh0GRuEqEbLXGVy.z3a6f8dZ08d0ANnUCsj7fVuVDCZJFLW', -- Cliente123!
    '2944654321',
    'CLIENTE',
    1
)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- ------------------------------------------------------------------------------
-- PROFESIONAL: Mariano (único profesional del salón)
-- ------------------------------------------------------------------------------
INSERT INTO `profesionales` (`nombre`, `apellido`, `especialidad`, `descripcion`, `imagen`, `activo`) VALUES
(
    'Mariano',
    'Reyes',
    'Colorimetría, Balayage & Peinados Creativos',
    'Estilista profesional con más de 10 años de experiencia en colorimetría avanzada, técnicas de iluminación balayage y peinados de novia. Especializado en el método organización del color para respetar la salud capilar.',
    'assets/images/profesional_mariano.webp',
    1
)
ON DUPLICATE KEY UPDATE `especialidad` = VALUES(`especialidad`);

-- ------------------------------------------------------------------------------
-- CATÁLOGO DE SERVICIOS
-- ------------------------------------------------------------------------------
INSERT INTO `servicios` (`nombre`, `categoria`, `descripcion`, `precio`, `duracion_minutos`, `imagen`, `destacado`, `activo`) VALUES
(
    'Corte Femenino',
    'Corte',
    'Corte de cabello personalizado con diagnóstico capilar previo. Incluye lavado, corte y finalización con difusor o planchado básico.',
    4500.00,
    60,
    'assets/images/corte_femenino.webp',
    1,
    1
),
(
    'Mechas Balayage',
    'Iluminación',
    'Técnica de iluminación pintada a mano libre para un efecto natural degradado. Incluye colocación, revelado, baño de color y tratamiento hidratante.',
    18000.00,
    180,
    'assets/images/mechas_balayage.webp',
    1,
    1
),
(
    'Coloración Completa',
    'Color',
    'Coloración total del cabello con tinte profesional sin amoníaco. Incluye diagnóstico, aplicación, revelado y enjuague acondicionador.',
    9500.00,
    90,
    'assets/images/coloracion_completa.webp',
    1,
    1
),
(
    'Tratamiento Keratina',
    'Tratamiento',
    'Tratamiento alisador de keratina que elimina el frizz y sella la cutícula del cabello por hasta 4 meses. Incluye lavado y planchado final.',
    14000.00,
    150,
    'assets/images/keratina.webp',
    1,
    1
),
(
    'Peinado para Evento',
    'Peinado',
    'Peinado artístico para bodas, cumpleaños de 15 años, graduaciones y cualquier evento especial. Incluye prueba de peinado previa coordinada con turno.',
    7500.00,
    90,
    'assets/images/peinado_evento.webp',
    1,
    1
),
(
    'Ondas Permanentes',
    'Técnica',
    'Permanente de ondas suaves y naturales con productos de alta calidad. Resultado duradero hasta 6 meses. Indicado para cabello sin tratamientos químicos previos recientes.',
    11000.00,
    120,
    'assets/images/ondas_permanentes.webp',
    0,
    1
)
ON DUPLICATE KEY UPDATE `precio` = VALUES(`precio`), `duracion_minutos` = VALUES(`duracion_minutos`);

-- ------------------------------------------------------------------------------
-- RESERVAS DE PRUEBA (usando las FK de usuarios, profesionales y servicios)
-- ------------------------------------------------------------------------------
INSERT INTO `reservas` (`usuario_id`, `profesional_id`, `servicio_id`, `fecha`, `hora`, `duracion_minutos`, `precio`, `estado`, `observaciones`)
SELECT
    u.id,
    p.id,
    s.id,
    DATE_FORMAT(NOW() + INTERVAL 2 DAY, '%Y-%m-%d'),
    '10:00:00',
    s.duracion_minutos,
    s.precio,
    'PENDIENTE',
    'Turno de prueba generado por seed'
FROM `usuarios` u
CROSS JOIN `profesionales` p
CROSS JOIN `servicios` s
WHERE u.email = 'camila@gmail.com'
  AND s.nombre = 'Mechas Balayage'
LIMIT 1;

INSERT INTO `reservas` (`usuario_id`, `profesional_id`, `servicio_id`, `fecha`, `hora`, `duracion_minutos`, `precio`, `estado`, `observaciones`)
SELECT
    u.id,
    p.id,
    s.id,
    DATE_FORMAT(NOW() + INTERVAL 4 DAY, '%Y-%m-%d'),
    '14:00:00',
    s.duracion_minutos,
    s.precio,
    'CONFIRMADA',
    'Reserva confirmada para el evento'
FROM `usuarios` u
CROSS JOIN `profesionales` p
CROSS JOIN `servicios` s
WHERE u.email = 'valentina@gmail.com'
  AND s.nombre = 'Peinado para Evento'
LIMIT 1;
