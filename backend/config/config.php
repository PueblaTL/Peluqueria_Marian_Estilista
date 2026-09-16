<?php
/**
 * config.php - Configuración General del Backend para Marian Estilista
 * Configuración de Base de Datos, Sesiones Seguras y Políticas CORS
 */

// Evitar que errores o warnings de PHP se impriman directamente en las respuestas JSON
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// Manejador global de excepciones para responder siempre en JSON válido y seguro ante cualquier fallo
set_exception_handler(function (Throwable $e) {
    // Registrar error técnico completo en los logs del servidor para el desarrollador
    error_log(sprintf(
        "[Marian Estilista Server Error] %s en %s:%d\nTrace:\n%s",
        $e->getMessage(),
        $e->getFile(),
        $e->getLine(),
        $e->getTraceAsString()
    ));

    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }

    // Mensaje seguro para el usuario final sin exponer detalles internos ni consultas SQL
    echo json_encode([
        'success' => false,
        'type'    => 'server',
        'message' => 'No pudimos completar la operación. Ocurrió un inconveniente temporal en el servidor. Por favor intentá nuevamente en unos minutos.',
        'error'   => 'SERVER_ERROR'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
});

// Detección de entorno: Local (XAMPP / Laragon / CLI) vs Producción (Hosting)
$httpHost = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
$isLocalHost = (bool) preg_match('#^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$#i', $httpHost);
$isLocalPath = (
    stripos(__DIR__, 'xampp') !== false || 
    stripos(__DIR__, 'laragon') !== false || 
    stripos(__DIR__, 'antigravity') !== false ||
    stripos(__DIR__, 'scratch') !== false
);
$isLocalEnvironment = $isLocalHost || (php_sapi_name() === 'cli' && $isLocalPath) || (empty($httpHost) && $isLocalPath);

if ($isLocalEnvironment) {
    // === ENTORNO LOCAL (XAMPP / Laragon) ===
    define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
    define('DB_NAME', getenv('DB_NAME') ?: 'marian_estilista');
    define('DB_USER', getenv('DB_USER') ?: 'root');
    define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
    define('DB_PORT', getenv('DB_PORT') ?: '3306');
} else {
    // === ENTORNO PRODUCCIÓN / HOSTING ===
    define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
    define('DB_NAME', getenv('DB_NAME') ?: 'a0190776_marian');
    define('DB_USER', getenv('DB_USER') ?: 'a0190776_marian');
    define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : 'CasaMoneda5050@');
    define('DB_PORT', getenv('DB_PORT') ?: '3306');
}
define('DB_CHARSET', 'utf8mb4');

// ==============================================================================
// CONFIGURACIÓN DE CORREO SALIENTE (SMTP DEL HOSTING)
// ==============================================================================
// Remitente oficial de verificación y notificaciones:
define('MAIL_FROM_ADDRESS', getenv('MAIL_FROM_ADDRESS') ?: 'jesusechavarria@marianestilista.online');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Marian Estilista');

// Parámetros del servidor SMTP del hosting (configurables en servidor o variables de entorno):
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'mail.marianestilista.online');
define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: 465)); // 465 (SSL) o 587 (TLS)
define('SMTP_USERNAME', getenv('SMTP_USERNAME') ?: 'jesusechavarria@marianestilista.online');
define('SMTP_PASSWORD', getenv('SMTP_PASSWORD') !== false ? getenv('SMTP_PASSWORD') : '');
define('SMTP_ENCRYPTION', getenv('SMTP_ENCRYPTION') ?: 'ssl'); // 'ssl' o 'tls'


// Configuración de Sesión Segura en PHP
if (session_status() === PHP_SESSION_NONE) {
    // Configurar atributos de la cookie de sesión antes de iniciarla
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
               (!empty($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);

    session_set_cookie_params([
        'lifetime' => 60 * 60 * 24 * 7, // 7 días
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    session_start();
}

// Configuración y Manejo de CORS (Cross-Origin Resource Sharing)
function setupCors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Orígenes permitidos habituales en desarrollo (Live Server, Apache, localhost)
    $allowedOrigins = [
        'http://localhost',
        'http://127.0.0.1',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:8000'
    ];

    if (!empty($origin)) {
        // Si el origen coincide o proviene de localhost con cualquier puerto
        $isLocalhost = preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin);
        if (in_array($origin, $allowedOrigins, true) || $isLocalhost) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
        }
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Content-Type: application/json; charset=utf-8');

    // Responder a las peticiones preflight OPTIONS del navegador
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Inicializar cabeceras CORS
setupCors();
