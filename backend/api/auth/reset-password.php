<?php
/**
 * reset-password.php - Endpoint API para Validación y Restablecimiento de Contraseña
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../../controllers/AuthController.php';

$controller = new AuthController();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $controller->validateResetToken();
} else {
    $controller->resetPassword();
}
