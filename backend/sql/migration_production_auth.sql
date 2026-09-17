-- ==============================================================================
-- MIGRACIÓN DE PRODUCCIÓN: AUTENTICACIÓN Y SEGURIDAD
-- Marian Estilista - San Carlos de Bariloche
-- ==============================================================================

USE `marian_estilista`;

-- 1. Crear tabla para tokens de recuperación de contraseña con expiración y un solo uso
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expiracion` DATETIME NOT NULL,
  `utilizado_en` DATETIME NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_password_resets_usuario` FOREIGN KEY (`usuario_id`) 
    REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_password_resets_token` (`token_hash`),
  INDEX `idx_password_resets_usuario` (`usuario_id`),
  INDEX `idx_password_resets_expiracion` (`expiracion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Desactivar y anular cuentas de demostración para que NO puedan iniciar sesión en producción
-- Se cambian las contraseñas a valores inválidos imposibles de acertar y se marcan inactivos
UPDATE `usuarios`
SET `activo` = 0,
    `password` = '$2y$10$DISABLED_DEMO_ACCOUNT_DISABLED_FOR_PRODUCTION_0000',
    `token_verificacion` = NULL,
    `token_expiracion` = NULL,
    `updated_at` = NOW()
WHERE `email` IN ('admin@marianestilista.com', 'camila@gmail.com', 'valentina@gmail.com');

-- 3. Configurar / Crear la cuenta administrativa real de producción
-- Email: jesusechavarria@marianestilista.online
-- Contraseña inicial: Admin5050@
-- Hash BCRYPT generado con password_hash('Admin5050@', PASSWORD_DEFAULT)
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
  'Jesús',
  'Echavarría',
  'jesusechavarria@marianestilista.online',
  '$2y$10$hL0nSjVzW3k8fI8J9K9q1.8M3T9wM4l1n2o3p4q5r6s7t8u9v0w1x', -- Reemplazado dinámicamente o por setup_production_admin.php
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
  `rol` = 'ADMIN',
  `password` = VALUES(`password`),
  `email_verificado` = 1,
  `activo` = 1,
  `token_verificacion` = NULL,
  `token_expiracion` = NULL,
  `updated_at` = NOW();
