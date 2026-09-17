-- ==============================================================================
-- BASE DE DATOS: marian_estilista
-- Sistema de Gestión y Reservas Online - Marian Estilista (Bariloche)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `marian_estilista`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `marian_estilista`;

-- ------------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- Roles soportados: 'CLIENTE', 'ADMIN'
-- Contraseñas almacenadas de forma segura con BCRYPT (password_hash)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(50) NULL,
  `rol` ENUM('CLIENTE', 'ADMIN') NOT NULL DEFAULT 'CLIENTE',
  `email_verificado` TINYINT(1) NOT NULL DEFAULT 0,
  `token_verificacion` VARCHAR(100) NULL,
  `token_expiracion` DATETIME NULL,
  `ultimo_reenvio_correo` DATETIME NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_usuarios_email` (`email`),
  INDEX `idx_usuarios_rol` (`rol`),
  INDEX `idx_usuarios_token` (`token_verificacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABLA: profesionales
-- Mariano (Estilista & Colorista titular de Marian Estilista)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `profesionales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `especialidad` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NULL,
  `imagen` VARCHAR(255) NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_profesionales_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABLA: servicios
-- Catálogo oficial de tratamientos capilares femeninos
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `servicios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL DEFAULT 'General',
  `descripcion` TEXT NULL,
  `precio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `precio_texto` VARCHAR(100) NULL,
  `duracion_minutos` INT NOT NULL DEFAULT 60,
  `imagen` VARCHAR(255) NULL,
  `destacado` TINYINT(1) NOT NULL DEFAULT 1,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `detalles` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_servicios_nombre` (`nombre`),
  INDEX `idx_servicios_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABLA: reservas
-- Turnos registrados para clientes con un profesional y servicio determinado
-- Estados: 'PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reservas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `profesional_id` INT NOT NULL,
  `servicio_id` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL,
  `duracion_minutos` INT NOT NULL DEFAULT 60,
  `precio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `estado` ENUM('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA') NOT NULL DEFAULT 'PENDIENTE',
  `observaciones` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reservas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reservas_profesional` FOREIGN KEY (`profesional_id`) REFERENCES `profesionales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reservas_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_reservas_prof_fecha_hora` (`profesional_id`, `fecha`, `hora`),
  INDEX `idx_reservas_usuario_fecha` (`usuario_id`, `fecha`),
  INDEX `idx_reservas_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABLA: password_resets
-- Tokens seguros de recuperación de contraseña con expiración y un solo uso
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expiracion` DATETIME NOT NULL,
  `utilizado_en` DATETIME NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_password_resets_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_password_resets_token` (`token_hash`),
  INDEX `idx_password_resets_usuario` (`usuario_id`),
  INDEX `idx_password_resets_expiracion` (`expiracion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

