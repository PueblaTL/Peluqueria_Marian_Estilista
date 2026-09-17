<?php
/**
 * setup_production_admin.php - Script Seguro de Inicialización del Administrador de Producción
 * Marian Estilista
 *
 * Configura la cuenta real del Administrador:
 * Email: jesusechavarria@marianestilista.online
 * Clave inicial: Admin5050@
 * 
 * - Genera el hash BCRYPT dinámicamente con password_hash().
 * - Desactiva e invalida las cuentas demo.
 * - Asegura la existencia de la tabla password_resets.
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';

$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    header('Content-Type: text/html; charset=utf-8');
}

try {
    $db = Database::getConnection();

    // 1. Crear tabla password_resets si no existe
    $sqlTable = "CREATE TABLE IF NOT EXISTS `password_resets` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $db->exec($sqlTable);

    // 2. Desactivar cuentas de prueba
    $stmtDisable = $db->prepare("UPDATE `usuarios` 
        SET `activo` = 0, 
            `password` = :disabledHash,
            `token_verificacion` = NULL,
            `token_expiracion` = NULL,
            `updated_at` = NOW()
        WHERE `email` IN ('admin@marianestilista.com', 'camila@gmail.com', 'valentina@gmail.com')");
    $disabledHash = '$2y$10$DISABLED_DEMO_ACCOUNT_DISABLED_FOR_PRODUCTION_0000';
    $stmtDisable->execute([':disabledHash' => $disabledHash]);
    $demosDisabled = $stmtDisable->rowCount();

    // 3. Configurar Administrador de Producción
    $adminEmail = 'jesusechavarria@marianestilista.online';
    $adminPassRaw = 'Admin5050@';
    $adminHash = password_hash($adminPassRaw, PASSWORD_DEFAULT);

    $stmtCheck = $db->prepare("SELECT id, email, password, rol, activo, email_verificado FROM `usuarios` WHERE `email` = ? LIMIT 1");
    $stmtCheck->execute([$adminEmail]);
    $existingAdmin = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if ($existingAdmin) {
        $stmtUpdate = $db->prepare("UPDATE `usuarios` 
            SET `nombre` = 'Jesús',
                `apellido` = 'Echavarría',
                `password` = :password,
                `rol` = 'ADMIN',
                `email_verificado` = 1,
                `activo` = 1,
                `token_verificacion` = NULL,
                `token_expiracion` = NULL,
                `updated_at` = NOW()
            WHERE `id` = :id");
        $stmtUpdate->execute([
            ':password' => $adminHash,
            ':id' => $existingAdmin['id']
        ]);
        $action = "ACTUALIZADO";
        $adminId = $existingAdmin['id'];
    } else {
        $stmtInsert = $db->prepare("INSERT INTO `usuarios` 
            (`nombre`, `apellido`, `email`, `password`, `telefono`, `rol`, `email_verificado`, `activo`, `created_at`, `updated_at`)
            VALUES ('Jesús', 'Echavarría', :email, :password, '2944000000', 'ADMIN', 1, 1, NOW(), NOW())");
        $stmtInsert->execute([
            ':email' => $adminEmail,
            ':password' => $adminHash
        ]);
        $action = "CREADO";
        $adminId = (int)$db->lastInsertId();
    }

    // 4. Verificar el hash del administrador
    $stmtVerify = $db->prepare("SELECT password FROM `usuarios` WHERE `id` = ?");
    $stmtVerify->execute([$adminId]);
    $storedHash = $stmtVerify->fetchColumn();
    $passwordValidates = password_verify($adminPassRaw, $storedHash);

    if (!$passwordValidates) {
        throw new Exception("Error de verificación: el hash almacenado no coincide con la contraseña configurada.");
    }

    if ($isCli) {
        echo "[OK] Setup de producción completado con éxito.\n";
        echo "Tabla password_resets: OK\n";
        echo "Cuentas demo desactivadas: {$demosDisabled}\n";
        echo "Administrador ({$action}): {$adminEmail} (ID: {$adminId})\n";
        echo "Validación de contraseña (password_verify): CORRECTO\n";
    } else {
        echo "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><title>Setup Producción</title>";
        echo "<style>body{font-family:sans-serif;background:#120A07;color:#FCF9F5;padding:40px}h1{color:#D98C16}.card{background:#21140E;border:1px solid #5C4B43;border-radius:12px;padding:25px;max-width:600px;margin:0 auto}.badge{background:#27ae60;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px}</style></head><body>";
        echo "<div class='card'>";
        echo "<h1>✓ Setup de Producción Exitoso</h1>";
        echo "<p><strong>Tabla password_resets:</strong> Lista</p>";
        echo "<p><strong>Cuentas Demo:</strong> Desactivadas ({$demosDisabled} registros actualizados)</p>";
        echo "<p><strong>Administrador:</strong> " . htmlspecialchars($adminEmail) . " <span class='badge'>{$action}</span></p>";
        echo "<p><strong>Validación de Hashing (BCRYPT):</strong> Verificado correctamente</p>";
        echo "<p><a href='../../frontend/pages/login.html' style='color:#D98C16'>Ir a Iniciar Sesión</a></p>";
        echo "</div></body></html>";
    }

} catch (Exception $e) {
    if ($isCli) {
        echo "[ERROR] " . $e->getMessage() . "\n";
    } else {
        echo "<div style='color:red;padding:20px'>Error: " . htmlspecialchars($e->getMessage()) . "</div>";
    }
    exit(1);
}
