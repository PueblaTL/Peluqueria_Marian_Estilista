<?php
/**
 * config.php - Configuración General del Backend para Marian Estilista
 * Configuración de Base de Datos, Sesiones Seguras y Políticas CORS
 */

// Evitar que errores o warnings de PHP se impriman directamente en las respuestas JSON
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// Configuración de zona horaria oficial (Argentina / UTC-3)
date_default_timezone_set('America/Argentina/Buenos_Aires');

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

// Carga de variables de entorno desde .env si existe (raíz o carpeta backend)
$envPaths = [__DIR__ . '/../../.env', __DIR__ . '/../.env'];
foreach ($envPaths as $envFile) {
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) continue;
            if (strpos($line, '=') !== false) {
                list($envKey, $envVal) = explode('=', $line, 2);
                $envKey = trim($envKey);
                $envVal = trim($envVal, " \t\n\r\0\x0B\"'");
                if (getenv($envKey) === false) {
                    putenv("$envKey=$envVal");
                    $_ENV[$envKey] = $envVal;
                    $_SERVER[$envKey] = $envVal;
                }
            }
        }
        break;
    }
}

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

// ==============================================================================
// CONFIGURACIÓN CENTRALIZADA DE URLS (PRODUCCIÓN VS DESARROLLO)
// ==============================================================================
if (!defined('APP_URL')) {
    $envAppUrl = getenv('APP_URL') ?: (getenv('BASE_URL') ?: null);
    if ($envAppUrl) {
        define('APP_URL', rtrim($envAppUrl, '/'));
    } elseif ($isLocalHost) {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
                    (!empty($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ? 'https://' : 'http://';
        $scriptPath = $_SERVER['SCRIPT_NAME'] ?? '';
        $baseFolder = '';
        if (preg_match('#^(.*?/(marian-estilista|peluqueria-portal))#i', $scriptPath, $m)) {
            $baseFolder = $m[1];
        }
        define('APP_URL', rtrim($protocol . $httpHost . $baseFolder, '/'));
    } else {
        define('APP_URL', 'https://marianestilista.online');
    }
}
if (!defined('BASE_URL')) {
    define('BASE_URL', APP_URL);
}

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
// CONFIGURACIÓN DE CORREO SALIENTE (SMTP DEL HOSTING DONWEB / FEROZO)
// ==============================================================================
// Remitente oficial de verificación y notificaciones:
define('MAIL_FROM_ADDRESS', getenv('MAIL_FROM_ADDRESS') ?: 'noreply@marianestilista.com.ar');
define('MAIL_FROM_NAME', getenv('MAIL_FROM_NAME') ?: 'Marian Estilista');

// Parámetros del servidor SMTP DonWeb/Ferozo:
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'a0190776.ferozo.com');
define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: 465)); // 465 (SSL/SMTPS) o 587 (TLS)
define('SMTP_USERNAME', getenv('SMTP_USERNAME') ?: (getenv('MAIL_USERNAME') ?: 'noreply@marianestilista.com.ar'));
define('SMTP_PASSWORD', getenv('SMTP_PASSWORD') !== false ? getenv('SMTP_PASSWORD') : (getenv('MAIL_PASSWORD') !== false ? getenv('MAIL_PASSWORD') : 'CasaMoneda5050/'));
define('SMTP_ENCRYPTION', getenv('SMTP_ENCRYPTION') ?: 'ssl'); // 'ssl' (SMTPS, puerto 465) o 'tls' (puerto 587)

// Correo de Marian para notificaciones de nuevos turnos:
define('MARIAN_NOTIFICATION_EMAIL', getenv('MARIAN_NOTIFICATION_EMAIL') ?: 'jesusechavarria057@gmail.com');


// Configuración de Sesión Segura en PHP
if (session_status() === PHP_SESSION_NONE) {
    // Detección exhaustiva de HTTPS (conexión directa o reverse proxy DonWeb / Ferozo / Cloudflare)
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
               (!empty($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443) ||
               (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') ||
               (!empty($_SERVER['HTTP_X_FORWARDED_SSL']) && strtolower($_SERVER['HTTP_X_FORWARDED_SSL']) === 'on');

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

    // Orígenes permitidos en desarrollo y producción
    $allowedOrigins = [
        'https://marianestilista.online',
        'http://marianestilista.online',
        'https://www.marianestilista.online',
        'http://www.marianestilista.online',
        'http://localhost',
        'http://127.0.0.1',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:8000'
    ];

    if (!empty($origin)) {
        $isLocalhost = preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin);
        $isProductionDomain = preg_match('#^https?://(www\.)?marianestilista\.online(:\d+)?$#i', $origin);
        if (in_array($origin, $allowedOrigins, true) || $isLocalhost || $isProductionDomain) {
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

