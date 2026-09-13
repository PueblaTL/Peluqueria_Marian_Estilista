<?php
/**
 * helpers.php - Funciones Auxiliares de Respuestas JSON, Seguridad y Autenticación
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/config.php';

/**
 * Emite una respuesta JSON estándar y termina la ejecución.
 *
 * @param bool $success
 * @param string $message
 * @param mixed|null $data
 * @param int $statusCode
 * @param string|null $error
 */
function jsonResponse(bool $success, string $message, $data = null, int $statusCode = 200, ?string $error = null): void {
    http_response_code($statusCode);

    $payload = [
        'success' => $success,
        'message' => $message
    ];

    if ($data !== null) {
        $payload['data'] = $data;
    }

    if ($error !== null) {
        $payload['error'] = $error;
    }

    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * Obtiene los datos del cuerpo de la petición (JSON o Form-Data).
 *
 * @return array
 */
function getRequestData(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $rawInput = file_get_contents('php://input');
        $decoded = json_decode($rawInput, true);
        return is_array($decoded) ? $decoded : [];
    }

    return $_POST ?: [];
}

/**
 * Sanitiza recursivamente cadenas de texto para prevenir XSS.
 *
 * @param mixed $input
 * @return mixed
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    if (is_string($input)) {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
    return $input;
}

/**
 * Obtiene el usuario autenticado en la sesión actual.
 *
 * @return array|null
 */
function getAuthUser(): ?array {
    return $_SESSION['usuario'] ?? null;
}

/**
 * Verifica que exista una sesión autenticada activa.
 * Si no está autenticado, responde con código 401 Unauthorized y detiene la ejecución.
 *
 * @return array Datos del usuario en sesión
 */
function requireAuth(): array {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(false, 'Acceso no autorizado. Debe iniciar sesión.', null, 401, 'UNAUTHORIZED');
    }
    return $user;
}

/**
 * Verifica que el usuario autenticado posea el rol 'ADMIN'.
 * Si no es administrador, responde con código 403 Forbidden y detiene la ejecución.
 *
 * @return array Datos del usuario administrador
 */
function requireAdmin(): array {
    $user = requireAuth();
    if (($user['rol'] ?? '') !== 'ADMIN') {
        jsonResponse(false, 'Acceso denegado. Se requieren permisos de administrador.', null, 403, 'FORBIDDEN');
    }
    return $user;
}
