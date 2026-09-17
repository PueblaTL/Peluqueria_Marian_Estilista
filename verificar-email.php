<?php
/**
 * verificar-email.php - Verificación de Correo y Redirección al Login
 * Marian Estilista - Sistema de Gestión y Reservas Online
 *
 * Procesa el token de verificación y redirige inmediatamente al Login
 * para que el resultado (éxito o aviso) se despliegue de forma visual,
 * nativa y elegante dentro de la interfaz de Marian Estilista.
 */

require_once __DIR__ . '/backend/config/config.php';
require_once __DIR__ . '/backend/config/helpers.php';
require_once __DIR__ . '/backend/services/AuthService.php';

$token = trim($_GET['token'] ?? '');
$loginUrl = 'frontend/pages/login.html';

if (empty($token)) {
    header("Location: {$loginUrl}");
    exit();
}

$authService = new AuthService();

try {
    $resultado = $authService->verifyEmail($token);
    
    // Si la cuenta ya estaba verificada
    if (!empty($resultado['alreadyVerified'])) {
        header("Location: {$loginUrl}?verify_error=already_verified");
        exit();
    }

    // Verificación exitosa
    header("Location: {$loginUrl}?verified=1");
    exit();

} catch (Exception $e) {
    if ($e->getCode() === 410) {
        // Token vencido
        header("Location: {$loginUrl}?verify_error=expired");
        exit();
    }
    
    // Token inválido o ya utilizado
    header("Location: {$loginUrl}?verify_error=invalid");
    exit();
}
