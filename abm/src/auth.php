<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
$sessionDirectory = dirname(__DIR__) . '/var/sessions';
if (!is_dir($sessionDirectory) && !mkdir($sessionDirectory, 0700, true) && !is_dir($sessionDirectory)) {
    http_response_code(503);
    exit('No se pudo iniciar la sesión. Verificá los permisos de abm/var.');
}
session_save_path($sessionDirectory);
if (session_status() === PHP_SESSION_NONE) {
    session_start(['cookie_httponly' => true, 'cookie_samesite' => 'Lax', 'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'use_strict_mode' => true]);
}

// Establecer Content-Type text/html únicamente si no fue establecido previamente (ej. por una API JSON)
$headers = headers_list();
$hasContentType = false;
foreach ($headers as $h) {
    if (stripos($h, 'Content-Type:') === 0) {
        $hasContentType = true;
        break;
    }
}
if (!$hasContentType) {
    header('Content-Type: text/html; charset=UTF-8');
}

header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
header('X-Content-Type-Options: nosniff');
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));

function csrfValid(): bool {
    return is_string($_POST['csrf'] ?? null) && hash_equals($_SESSION['csrf'], $_POST['csrf']);
}

function signIn(array $user): void {
    session_regenerate_id(true);
    $_SESSION = ['usuario_id'=>(int)$user['id'], 'nombre'=>$user['nombre'], 'email'=>$user['email'], 'rol'=>$user['rol'], 'last_activity'=>time(), 'csrf'=>bin2hex(random_bytes(32))];
}
function authenticated(): bool {
    if (!isset($_SESSION['usuario_id']) || time() - ($_SESSION['last_activity'] ?? 0) > 1800) {
        unset($_SESSION['usuario_id'], $_SESSION['nombre'], $_SESSION['email'], $_SESSION['rol']);
        return false;
    }
    $stmt = database()->prepare('SELECT u.id,u.nombre,u.email,r.nombre AS rol FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.id=?');
    $stmt->execute([$_SESSION['usuario_id']]);
    $user = $stmt->fetch();
    if (!$user) { unset($_SESSION['usuario_id'], $_SESSION['rol']); return false; }
    $_SESSION['rol']=$user['rol']; $_SESSION['nombre']=$user['nombre']; $_SESSION['email']=$user['email'];
    $_SESSION['last_activity']=time();
    return true;
}
function requireLogin(): void {
    try { $logged = authenticated(); } catch (Throwable $e) { error_log((string)$e); http_response_code(500); exit('No se pudo verificar la sesión.'); }
    if (!$logged) { header('Location: login.php', true, 303); exit; }
    if ($_SESSION['rol'] !== 'Administrador') { http_response_code(403); exit('Acceso denegado. Se requiere rol Administrador.'); }
}
function requireLoginApi(): void {
    try { $logged = authenticated(); } catch (Throwable $e) { error_log((string)$e); http_response_code(500); echo json_encode(['success'=>false,'message'=>'No se pudo verificar la sesión.']); exit; }
    $status = !$logged ? 401 : ($_SESSION['rol'] !== 'Administrador' ? 403 : 200);
    if ($status !== 200) { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode(['success'=>false,'message'=>'Acceso no autorizado.']); exit; }
}

function demoEnabled(): bool { $setting=getenv('AURA_DEMO_LOGIN'); return $setting === '1' || ($setting === false && in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1','::1'],true)); }
