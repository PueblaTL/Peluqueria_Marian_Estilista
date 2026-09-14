-- ==============================================================================
-- DATOS SEMILLA (SEED DATA): marian_estilista
-- Usuarios, profesionales, catálogo oficial y turnos de demostración
-- ==============================================================================

USE `marian_estilista`;

-- Desactivar temporalmente revisión de llaves foráneas para reinserción limpia
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `reservas`;
TRUNCATE TABLE `servicios`;
TRUNCATE TABLE `profesionales`;
TRUNCATE TABLE `usuarios`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. USUARIOS DEMO
-- Contraseñas hasheadas con BCRYPT ($2y$10$...):
--   admin@marianestilista.com -> Admin123!  (Rol: ADMIN)
--   camila@gmail.com          -> Cliente123! (Rol: CLIENTE)
--   luciana@gmail.com         -> Cliente123! (Rol: CLIENTE)
-- ------------------------------------------------------------------------------
INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `password`, `telefono`, `rol`, `activo`, `created_at`) VALUES
(1, 'Mariano', 'Administrador', 'admin@marianestilista.com', '$2y$10$.d4et4MU2b8aFX6h98rXCezcl/.9WI2D235iYlspF2VU19eSBUMma', '+54 2920 359074', 'ADMIN', 1, NOW()),
(2, 'Camila', 'Fernández', 'camila@gmail.com', '$2y$10$qU4/oCHRYC3T9zzD09GunOAoXTcESUnRBGJ8UeS3L5pPNVUf006JW', '+54 9 294 455-8899', 'CLIENTE', 1, NOW()),
(3, 'Luciana', 'García', 'luciana@gmail.com', '$2y$10$qU4/oCHRYC3T9zzD09GunOAoXTcESUnRBGJ8UeS3L5pPNVUf006JW', '+54 9 294 477-2233', 'CLIENTE', 1, NOW());

-- ------------------------------------------------------------------------------
-- 2. PROFESIONALES
-- Mariano: Estilista titular y fundador del salón en Bariloche
-- ------------------------------------------------------------------------------
INSERT INTO `profesionales` (`id`, `nombre`, `apellido`, `especialidad`, `descripcion`, `imagen`, `activo`, `created_at`) VALUES
(1, 'Mariano', 'Echavarría', 'Coloración, Balayage, Alisados y Peinados', 'Especialista en colorimetría avanzada, diseño de iluminación personalizada, alisados de alto brillo y tratamientos restauradores. Con más de 15 años de trayectoria en Bariloche.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', 1, NOW());

-- ------------------------------------------------------------------------------
-- 3. SERVICIOS OFICIALES DE MARIAN ESTILISTA
-- 5 servicios femeninos exclusivos
-- ------------------------------------------------------------------------------
INSERT INTO `servicios` (`id`, `nombre`, `categoria`, `descripcion`, `precio`, `duracion_minutos`, `imagen`, `destacado`, `activo`, `created_at`) VALUES
(1, 'Alisado Láser 6D', 'Alisados', 'Técnica avanzada de alisado y disciplina capilar. Incluye tratamiento termoactivo, sellado de la fibra, reducción del frizz y acabado ultra liso con brillo intenso.', 150000.00, 150, 'assets/images/alisado_6d.webp', 1, 1, NOW()),
(2, 'Mechas Balayage', 'Iluminación', 'Técnica francesa de iluminación degradada a mano alzada. Incluye matización personalizada, baño de luz gloss, tratamiento nutritivo y peinado con ondas.', 95000.00, 180, 'assets/images/mechas_balayage.webp', 1, 1, NOW()),
(3, 'Mechas Localizadas', 'Iluminación', 'Técnica de iluminación estratégica para realzar zonas específicas del cabello y potenciar los rasgos del rostro. Incluye aclaración, matización tonal y peinado.', 85000.00, 120, 'assets/images/mechas_localizadas.webp', 1, 1, NOW()),
(4, 'Mechas Babylight', 'Iluminación', 'Técnica de iluminación ultrafina inspirada en reflejos naturales. Incluye aclaración delicada, matización personalizada, baño de luz gloss y peinado.', 88000.00, 150, 'assets/images/mechas_babylight_2.webp', 1, 1, NOW()),
(5, 'Peinados para Eventos', 'Peinados', 'Peinados personalizados para novias, 15 años y eventos especiales. Diseños sofisticados y duraderos: ondas al agua, semirrecogidos y recogidos de autor.', 48000.00, 60, 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80', 1, 1, NOW());

-- ------------------------------------------------------------------------------
-- 4. RESERVAS INICIALES DE PRUEBA
-- ------------------------------------------------------------------------------
INSERT INTO `reservas` (`id`, `usuario_id`, `profesional_id`, `servicio_id`, `fecha`, `hora`, `duracion_minutos`, `precio`, `estado`, `observaciones`, `created_at`) VALUES
(1, 2, 1, 2, CURDATE(), '10:00:00', 180, 95000.00, 'CONFIRMADA', 'Quiere tonos beige manteca', NOW()),
(2, 3, 1, 4, CURDATE(), '15:00:00', 150, 88000.00, 'PENDIENTE', 'Primera vez en el salón', NOW()),
(3, 2, 1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 150, 150000.00, 'CONFIRMADA', 'Cabello largo con volumen', NOW());
