<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/auth.php';
$error = ''; $email = is_string($_POST['email'] ?? null) ? trim($_POST['email']) : '';
try {
    if (authenticated()) { header('Location: ' . ($_SESSION['rol']==='Administrador' ? 'index.php' : 'cuenta.php'), true, 303); exit; }
    if ($_SERVER['REQUEST_METHOD']==='POST') {
        if (!csrfValid()) { http_response_code(403); $error='Formulario vencido. Recargá la página.'; }
        else {
            $db=database(); $db->beginTransaction();
            $stmt=$db->prepare('SELECT u.*,r.nombre AS rol,(u.bloqueado_hasta > NOW()) AS bloqueado FROM usuarios u JOIN roles r ON r.id=u.rol_id WHERE u.email=? OR u.nickname=? FOR UPDATE');
            $stmt->execute([$email,$email]); $user=$stmt->fetch();
            $password=is_string($_POST['password'] ?? null) ? $_POST['password'] : '';
            if (!$user || $user['bloqueado'] || strlen($password)>72 || !password_verify($password, $user['password_hash'] ?? '')) {
                if ($user && !$user['bloqueado']) {
                    $n=$user['bloqueado_hasta']!==null ? 1 : (int)$user['intentos']+1;
                    $db->prepare('UPDATE usuarios SET intentos=?,bloqueado_hasta=IF(? >= 5,DATE_ADD(NOW(), INTERVAL 5 MINUTE),NULL) WHERE id=?')->execute([$n,$n,$user['id']]);
                }
                $db->commit(); http_response_code(401); $error='Credenciales incorrectas o cuenta bloqueada temporalmente. Después de 5 intentos, esperá 5 minutos.';
            } else {
                $db->prepare('UPDATE usuarios SET intentos=0,bloqueado_hasta=NULL WHERE id=?')->execute([$user['id']]); $db->commit(); signIn($user);
                header('Location: '.($user['rol']==='Administrador' ? 'index.php':'cuenta.php'),true,303); exit;
            }
        }
    }
} catch(Throwable $ex) { if(isset($db) && $db->inTransaction()) $db->rollBack(); error_log((string)$ex); http_response_code(500); $error='No se pudo iniciar sesión. Verificá la conexión y la instalación de MySQL.'; }
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ingresar · Aura Studio</title><link rel="stylesheet" href="styles.css"></head><body><header><a class="brand" href="../../index.html">Aura Studio</a></header><main class="login-main"><h1>Iniciar sesión</h1><?php if(isset($_GET['registrado'])): ?><p class="notice">Cuenta creada correctamente. Ya podés iniciar sesión.</p><?php endif; ?>
<?php if($error): ?><div class="error-summary" role="alert"><?=e($error)?></div><?php endif; ?>
<form method="post" class="card form-card"><input type="hidden" name="csrf" value="<?=e($_SESSION['csrf'])?>"><div class="field"><label for="email">Email o nickname</label><input id="email" name="email" autocomplete="username" required maxlength="254" value="<?=e($email)?>"></div><div class="field"><label for="password">Contraseña</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="72"></div><div class="form-actions"><button>Ingresar</button><a href="registro.php">Crear una cuenta</a></div></form>
<?php if (demoEnabled()): ?><form method="post" action="demo_login.php" class="card"><input type="hidden" name="csrf" value="<?=e($_SESSION['csrf'])?>"><p>Acceso para la demostración universitaria.</p><button>Ingresar como administrador de prueba</button></form><?php endif; ?></main></body></html>
