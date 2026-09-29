<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/auth.php';
if (authenticated()) { header('Location: index.php', true, 303); exit; }
$error = '';
$email = is_string($_POST['email'] ?? null) ? trim($_POST['email']) : '';
$password = is_string($_POST['password'] ?? null) ? $_POST['password'] : '';
$local = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
$setup = false;
$db = null;
try {
    $db = database();
    $admin = $db->query('SELECT * FROM administradores WHERE id = 1')->fetch();
    $setup = !$admin;
    if ($setup && !$local) { http_response_code(403); $error = 'La cuenta inicial debe configurarse desde localhost.'; }
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!csrfValid()) { http_response_code(403); $error = 'Formulario vencido. Recargá la página.'; }
        elseif ($setup) {
            $confirmation = is_string($_POST['confirmation'] ?? null) ? $_POST['confirmation'] : '';
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) $error = 'Ingresá un email válido.';
            elseif (strlen($password) < 12 || strlen($password) > 72) $error = 'La contraseña debe tener entre 12 y 72 bytes (al menos 12 caracteres ASCII).';
            elseif ($password !== $confirmation) $error = 'Las contraseñas no coinciden.';
            else {
                $stmt = $db->prepare('INSERT INTO administradores (id, email, password_hash) VALUES (1, ?, ?)');
                $stmt->execute([$email, password_hash($password, PASSWORD_DEFAULT)]);
                session_regenerate_id(true);
                $_SESSION['csrf'] = bin2hex(random_bytes(32));
                $_SESSION['admin'] = $email;
                $_SESSION['last_activity'] = time();
                header('Location: index.php', true, 303); exit;
            }
        } else {
            // Bloqueo por cuenta persistido en MySQL, independiente de la sesión del navegador.
            $db->beginTransaction();
            $admin = $db->query('SELECT *, (bloqueado_hasta > NOW()) AS bloqueado FROM administradores WHERE id = 1 FOR UPDATE')->fetch();
            $valid = strlen($password) <= 72 && password_verify($password, $admin['password_hash']);
            if ($admin['bloqueado'] || strcasecmp($email, $admin['email']) !== 0 || !$valid) {
                if (!$admin['bloqueado']) {
                    $attempts = $admin['bloqueado_hasta'] !== null ? 1 : (int) $admin['intentos'] + 1;
                    $stmt = $db->prepare('UPDATE administradores SET intentos = ?, bloqueado_hasta = IF(? >= 5, DATE_ADD(NOW(), INTERVAL 5 MINUTE), NULL) WHERE id = 1');
                    $stmt->execute([$attempts, $attempts]);
                }
                $db->commit();
                http_response_code(401);
                $error = 'No se pudo iniciar sesión. Revisá los datos; después de 5 intentos fallidos, esperá 5 minutos.';
            } else {
                $db->exec('UPDATE administradores SET intentos = 0, bloqueado_hasta = NULL WHERE id = 1');
                $db->commit();
                session_regenerate_id(true);
                $_SESSION['csrf'] = bin2hex(random_bytes(32));
                $_SESSION['admin'] = $admin['email'];
                $_SESSION['last_activity'] = time();
                header('Location: index.php', true, 303); exit;
            }
        }
    }
} catch (Throwable $ex) {
    if ($db && $db->inTransaction()) $db->rollBack();
    error_log((string) $ex);
    http_response_code(503);
    $error = 'No se pudo acceder. Verificá MySQL y ejecutá php abm/database/install.php si todavía no instalaste el módulo. Si acabás de crear la cuenta, recargá la página.';
}
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ingresar · Aura Studio</title><link rel="stylesheet" href="styles.css"></head><body>
<header><a class="brand" href="login.php">A<span>Aura Studio<small>Panel de administración</small></span></a></header>
<main class="login-main"><div class="heading"><div><p class="eyebrow">AURA STUDIO</p><h1><?= $setup ? 'Creá tu cuenta inicial' : 'Iniciar sesión' ?></h1><p class="muted"><?= $setup ? 'Configurá el acceso de administrador. Este paso se realiza una sola vez desde este equipo.' : 'Ingresá para administrar usuarios y roles.' ?></p></div></div>
<form method="post" class="card form-card"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
<?php if ($error): ?><div class="error-summary" role="alert"><?= e($error) ?></div><?php endif; ?>
<div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" maxlength="254" required value="<?= e($email) ?>"></div>
<div class="field login-field"><label for="password">Contraseña</label><input id="password" name="password" type="password" autocomplete="<?= $setup ? 'new-password' : 'current-password' ?>" required <?= $setup ? 'minlength="12"' : '' ?>><small class="muted"><?= $setup ? 'Usá una contraseña de al menos 12 caracteres, hasta 72 bytes.' : 'La sesión vence después de 30 minutos de inactividad.' ?></small></div>
<?php if ($setup): ?><div class="field login-field"><label for="confirmation">Repetí la contraseña</label><input id="confirmation" name="confirmation" type="password" autocomplete="new-password" required minlength="12"></div><?php endif; ?>
<div class="form-actions"><button type="submit" <?= $setup && !$local ? 'disabled' : '' ?>><?= $setup ? 'Crear cuenta e ingresar' : 'Ingresar al panel' ?></button></div></form></main></body></html>
