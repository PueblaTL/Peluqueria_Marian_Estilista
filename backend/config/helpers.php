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
 * @param string|null $type Tipo semántico de respuesta: 'validation', 'availability', 'unverified_email', 'auth', 'server', 'success'
 */
function jsonResponse(bool $success, string $message, $data = null, int $statusCode = 200, ?string $error = null, ?string $type = null): void {
    http_response_code($statusCode);

    // Deducir tipo semántico si no fue especificado explícitamente
    if ($type === null) {
        if ($success) {
            $type = 'success';
        } else {
            if ($statusCode === 409 || $error === 'SCHEDULE_UNAVAILABLE') {
                $type = 'availability';
            } elseif ($error === 'UNVERIFIED_EMAIL' || $statusCode === 403) {
                $type = 'unverified_email';
            } elseif ($statusCode === 401 || $error === 'LOGIN_FAILED' || $error === 'UNAUTHENTICATED') {
                $type = 'auth';
            } elseif ($statusCode === 400 || $error === 'VALIDATION_ERROR' || $error === 'INVALID_INPUT') {
                $type = 'validation';
            } elseif ($statusCode >= 500) {
                $type = 'server';
            } else {
                $type = 'error';
            }
        }
    }

    $payload = [
        'success' => $success,
        'type'    => $type,
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
 * Valida un nombre o apellido asegurando caracteres válidos en español (tildes, diéresis, ñ).
 *
 * @param string $nombre
 * @return bool
 */
function validarNombre(string $nombre): bool {
    $nombre = trim($nombre);
    if (mb_strlen($nombre, 'UTF-8') < 2 || mb_strlen($nombre, 'UTF-8') > 60) {
        return false;
    }
    // Permite todas las letras Unicode (incluyendo tildes, diéresis, ñ/Ñ), espacios, apóstrofes y guiones
    return (bool)preg_match('/^[\p{L}\s\'-]{2,60}$/u', $nombre);
}

/**
 * Valida un formato de número de teléfono flexible (con código de área, internacional, separadores).
 * Permite números como: 2920382930, 2920 382930, 2920-382930, 2920 38-2930, +54 2920 382930, +5492920382930.
 * Rechaza: letras, '123', '++++', valores sin suficientes dígitos.
 *
 * @param string $telefono
 * @return bool
 */
function validarTelefono(string $telefono): bool {
    $telefono = trim($telefono);
    if (empty($telefono)) {
        return false;
    }

    // Estructura general: opcional '+' inicial, seguido de dígitos, espacios, guiones o paréntesis
    if (!preg_match('/^\+?[0-9\s\-\(\)]{7,25}$/', $telefono)) {
        return false;
    }

    // Contar cantidad de dígitos limpios (debe tener entre 8 y 15 dígitos)
    $digitos = preg_replace('/\D/', '', $telefono);
    $cantDigitos = strlen($digitos);
    if ($cantDigitos < 8 || $cantDigitos > 15) {
        return false;
    }

    return true;
}

/**
 * Normaliza un número telefónico para almacenamiento uniforme y consistente en MySQL.
 * Estrategia única:
 * - Si comienza con '+', conserva el '+' y remueve espacios, guiones y paréntesis (ej: +5492920382930).
 * - Si no tiene '+', extrae los dígitos limpios (ej: 2920382930).
 *
 * @param string $telefono
 * @return string
 */
function normalizarTelefono(string $telefono): string {
    $telefono = trim($telefono);
    $tienePlus = str_starts_with($telefono, '+');
    $digitos = preg_replace('/\D/', '', $telefono);

    return $tienePlus ? ('+' . $digitos) : $digitos;
}

/**
 * Valida el formato de un correo electrónico.
 *
 * @param string $email
 * @return bool
 */
function validarEmail(string $email): bool {
    $email = strtolower(trim($email));
    if (empty($email) || strlen($email) > 150) {
        return false;
    }
    return (bool)filter_var($email, FILTER_VALIDATE_EMAIL);
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
