<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/auth.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); header('Allow: POST'); exit; }
if (!csrfValid()) { http_response_code(403); exit('Formulario inválido.'); }
$_SESSION = [];
$params = session_get_cookie_params();
setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $params['path'], 'secure' => $params['secure'], 'httponly' => true, 'samesite' => 'Lax']);
session_destroy();
header('Location: login.php', true, 303);
