<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/auth.php';
if ($_SERVER['REQUEST_METHOD']!=='POST') { http_response_code(405); header('Allow: POST'); exit('Método no permitido.'); }
if (!demoEnabled() || !csrfValid()) { http_response_code(403); exit('Acceso demo deshabilitado o formulario vencido.'); }
try {
    $stmt=database()->prepare("SELECT u.*,r.nombre AS rol FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.email=? AND r.nombre='Administrador'");
    $stmt->execute(['admin@aurastudio.local']); $user=$stmt->fetch();
    if (!$user) { http_response_code(409); exit('Falta el administrador demo. Ejecutá la migración.'); }
    signIn($user); header('Location: index.php',true,303);
} catch(Throwable $e) { error_log((string)$e); http_response_code(500); echo 'No se pudo iniciar la sesión demo.'; }
