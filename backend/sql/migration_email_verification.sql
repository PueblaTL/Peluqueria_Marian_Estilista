-- ==============================================================================
-- MIGRACIÓN: Verificación de Correo Electrónico
-- Marian Estilista - Base de Datos MySQL
-- ==============================================================================

USE `marian_estilista`;

-- 1. Agregar columnas a la tabla `usuarios` si no existen
SET @dbname = DATABASE();
SET @tablename = "usuarios";

-- Agregar columna `email_verificado`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "email_verificado"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `usuarios` ADD COLUMN `email_verificado` TINYINT(1) NOT NULL DEFAULT 0 AFTER `rol`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar columna `token_verificacion`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "token_verificacion"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `usuarios` ADD COLUMN `token_verificacion` VARCHAR(100) NULL AFTER `email_verificado`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar columna `token_expiracion`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "token_expiracion"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `usuarios` ADD COLUMN `token_expiracion` DATETIME NULL AFTER `token_verificacion`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar columna `ultimo_reenvio_correo`
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = "ultimo_reenvio_correo"
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `usuarios` ADD COLUMN `ultimo_reenvio_correo` DATETIME NULL AFTER `token_expiracion`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Asegurar que la columna telefono sea VARCHAR(50) para soportar telefonos flexibles e internacionales
ALTER TABLE `usuarios` MODIFY COLUMN `telefono` VARCHAR(50) NULL;

-- 3. Asegurar que los usuarios preexistentes tengan email_verificado = 1
UPDATE `usuarios` SET `email_verificado` = 1 WHERE `email_verificado` = 0;
