<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$sessionDirectory = dirname(__DIR__) . '/var/sessions';
if (!is_dir($sessionDirectory) && !mkdir($sessionDirectory, 0700, true) && !is_dir($sessionDirectory)) {
    http_response_code(503);
    exit('No se pudo iniciar la sesión. Verificá los permisos de abm/var.');
}
session_save_path($sessionDirectory);
session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax', 'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'use_strict_mode' => true]);
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
header('X-Content-Type-Options: nosniff');
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));

function csrfValid(): bool {
    return is_string($_POST['csrf'] ?? null) && hash_equals($_SESSION['csrf'], $_POST['csrf']);
}
function authenticated(): bool {
    if (!isset($_SESSION['admin']) || time() - ($_SESSION['last_activity'] ?? 0) > 1800) {
        unset($_SESSION['admin'], $_SESSION['last_activity']);
        return false;
    }
    $_SESSION['last_activity'] = time();
    return true;
}
function requireLogin(): void {
    if (!authenticated()) { header('Location: login.php', true, 303); exit; }
}
