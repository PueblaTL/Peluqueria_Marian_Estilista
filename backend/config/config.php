<?php
/**
 * config.php - Configuración General del Backend para Marian Estilista
 * Configuración de Base de Datos, Sesiones Seguras y Políticas CORS
 */

// Evitar que errores o warnings de PHP se impriman directamente en las respuestas JSON
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// Parámetros de Conexión a Base de Datos (Personalizables por entorno)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'marian_estilista');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_CHARSET', 'utf8mb4');

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
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Inicializar cabeceras CORS
setupCors();
