-- ==============================================================================
-- MIGRACIÓN: Catálogo de Peinados Individuales y Deduplicación de Servicios
-- Marian Estilista (San Carlos de Bariloche)
-- ==============================================================================

USE `marian_estilista`;

-- 1. Eliminar duplicados históricos en la tabla de servicios
-- Conservar las filas canónicas originales (IDs 1 al 5) o reasignar referencias
UPDATE `reservas` SET `servicio_id` = 2 WHERE `servicio_id` IN (7, 12);
UPDATE `reservas` SET `servicio_id` = 5 WHERE `servicio_id` IN (10, 15);

-- Eliminar registros duplicados posteriores (IDs mayores a 5 que repitan nombres)
DELETE FROM `servicios` WHERE `id` > 5 AND `nombre` IN (
  'Alisado Láser 6D', 'Mechas Balayage', 'Mechas Localizadas', 'Mechas Babylight', 'Peinados para Eventos'
);

-- 2. Asegurar que los 4 tratamientos capilares principales estén activos y actualizados
UPDATE `servicios` SET
  `categoria` = 'Alisados',
  `precio` = 150000.00,
  `precio_texto` = '$150.000 a $180.000',
  `duracion_minutos` = 150,
  `imagen` = 'assets/images/alisado_6d.webp',
  `activo` = 1
WHERE `nombre` = 'Alisado Láser 6D';

UPDATE `servicios` SET
  `categoria` = 'Iluminación',
  `precio` = 150000.00,
  `precio_texto` = '$150.000 a $180.000',
  `duracion_minutos` = 180,
  `imagen` = 'assets/images/mechas_balayage_2.webp',
  `activo` = 1
WHERE `nombre` = 'Mechas Balayage';

UPDATE `servicios` SET
  `categoria` = 'Iluminación',
  `precio` = 150000.00,
  `precio_texto` = '$150.000 a $180.000',
  `duracion_minutos` = 120,
  `imagen` = 'assets/images/mechas_localizadas_2.webp',
  `activo` = 1
WHERE `nombre` = 'Mechas Localizadas';

UPDATE `servicios` SET
  `categoria` = 'Iluminación',
  `precio` = 150000.00,
  `precio_texto` = '$150.000 a $180.000',
  `duracion_minutos` = 150,
  `imagen` = 'assets/images/mechas_babylight_2.webp',
  `activo` = 1
WHERE `nombre` = 'Mechas Babylight';

-- 3. Marcar "Peinados para Eventos" como inactivo para reservas directas
-- Se mantiene en la BD para integridad referencial histórica y como categoría en la landing
UPDATE `servicios` SET
  `categoria` = 'Peinados',
  `activo` = 0,
  `destacado` = 0,
  `precio_texto` = 'Desde $30.000'
WHERE `nombre` = 'Peinados para Eventos';

-- 4. Insertar o actualizar los 7 servicios individuales de peinados para RESERVAS
-- Duraciones oficiales razonables documentadas:
--   Ondas / Brushing: 60 min
--   Semirrecogido: 60 min
--   Recogido: 60 min
--   Peinado social / fiesta: 60 min
--   Peinado 15 años: 90 min
--   Peinado de novia: 90 min
--   Prueba de peinado: 60 min

INSERT INTO `servicios` (`nombre`, `categoria`, `descripcion`, `precio`, `precio_texto`, `duracion_minutos`, `imagen`, `destacado`, `activo`) VALUES
(
  'Ondas / Brushing con ondas',
  'Peinados',
  'Brushing con ondas suaves y definidas para lograr un acabado elegante, natural y con movimiento. Ideal para eventos, celebraciones o para darle un toque especial a tu look.',
  30000.00,
  '$30.000',
  60,
  'assets/images/peinados/peinado_ondas.jpg',
  1,
  1
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
  1
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
  1
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
  1
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
  1
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
  1
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
  1
)
ON DUPLICATE KEY UPDATE
  `categoria`        = VALUES(`categoria`),
  `descripcion`      = VALUES(`descripcion`),
  `precio`           = VALUES(`precio`),
  `precio_texto`     = VALUES(`precio_texto`),
  `duracion_minutos` = VALUES(`duracion_minutos`),
  `imagen`           = VALUES(`imagen`),
  `destacado`        = VALUES(`destacado`),
  `activo`           = VALUES(`activo`);

-- 5. Agregar índice único sobre el nombre para evitar duplicados futuros
ALTER TABLE `servicios` ADD UNIQUE KEY `idx_servicios_nombre_unique` (`nombre`);
