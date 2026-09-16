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
INSERT INTO `usuarios` (`nombre`, `apellido`, `email`, `password`, `telefono`, `rol`, `email_verificado`, `token_verificacion`, `token_expiracion`, `ultimo_reenvio_correo`, `activo`) VALUES
(
    'Marian',
    'Admin',
    'admin@marianestilista.com',
    '$2y$10$.nJgbrUfeNeW8JWjbgtaHO5qdRdPDGmBEgJWTcyXoy6QbhtJfr416', -- Admin123!
    '2944000001',
    'ADMIN',
    1,
    NULL,
    NULL,
    NULL,
    1
),
(
    'Camila',
    'González',
    'camila@gmail.com',
    '$2y$10$bAoJnVcJKybA0ib4twzjTu6KAAf5YwbopDWfIPK6Aw9T/DBUcNV4y', -- Cliente123!
    '2944123456',
    'CLIENTE',
    1,
    NULL,
    NULL,
    NULL,
    1
),
(
    'Valentina',
    'Rodríguez',
    'valentina@gmail.com',
    '$2y$10$bAoJnVcJKybA0ib4twzjTu6KAAf5YwbopDWfIPK6Aw9T/DBUcNV4y', -- Cliente123!
    '2944654321',
    'CLIENTE',
    1,
    NULL,
    NULL,
    NULL,
    1
)
ON DUPLICATE KEY UPDATE
    `email_verificado`      = 1,
    `token_verificacion`    = NULL,
    `token_expiracion`      = NULL,
    `activo`                = 1;

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
-- 4 tratamientos capilares + 1 tarjeta informativa para landing + 7 peinados individuales para reservas
-- Sincronizado exactamente con ServicioService.php
-- ------------------------------------------------------------------------------

INSERT INTO `servicios` (`nombre`, `categoria`, `descripcion`, `precio`, `precio_texto`, `duracion_minutos`, `imagen`, `destacado`, `activo`, `detalles`) VALUES
(
    'Alisado Láser 6D',
    'Alisados',
    'Técnica avanzada de alisado y disciplina capilar. Incluye tratamiento termoactivo, sellado de la fibra, reducción del frizz y acabado ultra liso con brillo intenso. El valor depende del largo, volumen y cantidad de cabello.',
    150000.00,
    '$150.000 a $180.000',
    150,
    'assets/images/alisado_6d.webp',
    1,
    1,
    NULL
),
(
    'Mechas Balayage',
    'Iluminación',
    'Iluminación personalizada con efecto degradado y luminoso, diseñada para aportar dimensión, movimiento y un resultado natural y sofisticado. Ideal para renovar tu look y realzar la belleza del cabello. El valor depende del largo, volumen y cantidad de cabello.',
    150000.00,
    '$150.000 a $180.000',
    180,
    'assets/images/mechas_balayage_2.webp',
    1,
    1,
    NULL
),
(
    'Mechas Localizadas',
    'Iluminación',
    'Técnica personalizada que aporta luminosidad y dimensión en zonas estratégicas del cabello, resaltando las facciones del rostro. Ideal para lograr un cambio sutil, elegante y natural, adaptado a tu estilo. El valor depende del largo, volumen y cantidad de cabello.',
    150000.00,
    '$150.000 a $180.000',
    120,
    'assets/images/mechas_localizadas_2.webp',
    1,
    1,
    NULL
),
(
    'Mechas Babylight',
    'Iluminación',
    'Mechas finas y personalizadas que crean una iluminación natural, delicada y luminosa. Aportan brillo, dimensión y un look moderno y sofisticado, logrando un efecto sutil inspirado en los reflejos naturales del cabello. El valor depende del largo, volumen y cantidad de cabello.',
    150000.00,
    '$150.000 a $180.000',
    150,
    'assets/images/mechas_babylight_2.webp',
    1,
    1,
    NULL
),
(
    'Peinados para Eventos',
    'Peinados',
    'Peinados personalizados para quinceañeras, bodas y ocasiones especiales. Diseños pensados para que luzcas increíble en cada momento importante, adaptados a tu estilo, personalidad y ocasión.',
    30000.00,
    'Desde $30.000',
    60,
    'assets/images/peinados_1.webp',
    0,
    0,
    '[{"nombre":"Ondas / Brushing con ondas","precio":30000,"precioTexto":"$30.000","imagen":"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"},{"nombre":"Semirrecogido","precio":40000,"precioTexto":"$40.000","imagen":"https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=600&q=80"},{"nombre":"Recogido","precio":50000,"precioTexto":"$50.000","imagen":"https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80"},{"nombre":"Peinado social / fiesta","precio":55000,"precioTexto":"$55.000","imagen":"https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80"},{"nombre":"Peinado 15 años","precio":65000,"precioTexto":"$65.000","imagen":"https://images.unsplash.com/photo-1595867818082-083862f3d630?auto=format&fit=crop&w=600&q=80"},{"nombre":"Peinado de novia","precio":80000,"precioTexto":"desde $80.000","imagen":"https://images.unsplash.com/photo-1511285560929-80b456503681?auto=format&fit=crop&w=600&q=80"},{"nombre":"Prueba de peinado","precio":35000,"precioTexto":"$35.000","imagen":"https://images.unsplash.com/photo-1560066984-138daaa5a80e?auto=format&fit=crop&w=600&q=80"}]'
),
(
    'Ondas / Brushing con ondas',
    'Peinados',
    'Brushing con ondas suaves y definidas para lograr un acabado elegante, natural y con movimiento. Ideal para eventos, celebraciones o para darle un toque especial a tu look.',
    30000.00,
    '$30.000',
    60,
    'assets/images/peinados/peinado_ondas.jpg',
    1,
    1,
    NULL
),
(
    'Semirrecogido',
    'Peinados',
    'Peinado elegante que combina el cabello suelto con secciones recogidas. Una opción versátil y delicada para eventos, fiestas y celebraciones especiales.',
    40000.00,
    '$40.000',
    60,
    'assets/images/peinados/peinado_semirrecogido.jpg',
    1,
    1,
    NULL
),
(
    'Recogido',
    'Peinados',
    'Peinado completamente recogido, diseñado para lograr un look sofisticado y duradero. Ideal para eventos formales y ocasiones especiales.',
    50000.00,
    '$50.000',
    60,
    'assets/images/peinados/peinado_recogido.jpg',
    1,
    1,
    NULL
),
(
    'Peinado social / fiesta',
    'Peinados',
    'Peinado personalizado para fiestas y eventos, adaptado al estilo, vestido y ocasión de cada clienta. Incluye una propuesta elegante y cuidada hasta el último detalle.',
    55000.00,
    '$55.000',
    60,
    'assets/images/peinados/peinado_social.jpg',
    1,
    1,
    NULL
),
(
    'Peinado 15 años',
    'Peinados',
    'Peinado especialmente diseñado para celebraciones de 15 años, buscando un resultado elegante, juvenil y acorde al estilo elegido para una ocasión única.',
    65000.00,
    '$65.000',
    90,
    'assets/images/peinados/peinado_15anos.jpg',
    1,
    1,
    NULL
),
(
    'Peinado de novia',
    'Peinados',
    'Peinado personalizado para novias, diseñado de acuerdo con el vestido, accesorios, estilo de la celebración y preferencias de cada clienta. El precio es desde $80.000 y puede variar según la complejidad del trabajo.',
    80000.00,
    'Desde $80.000',
    90,
    'assets/images/peinados/peinado_novia.jpg',
    1,
    1,
    NULL
),
(
    'Prueba de peinado',
    'Peinados',
    'Prueba previa para definir y ajustar el peinado elegido antes del evento. Permite evaluar el estilo, volumen, accesorios y terminación para llegar al día especial con todo definido.',
    35000.00,
    '$35.000',
    60,
    'assets/images/peinados/peinado_prueba.jpg',
    1,
    1,
    NULL
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
  AND s.nombre = 'Peinado social / fiesta'
LIMIT 1;
