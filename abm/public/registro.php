<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/auth.php';
$errors=[];
if ($_SERVER['REQUEST_METHOD']==='POST') {
    if (!csrfValid()) { http_response_code(403); $errors=['Formulario vencido. Recargá la página.']; }
    else try {
        $db=database(); $rol=$db->query("SELECT id FROM roles WHERE nombre='Usuario'")->fetchColumn();
        if (!$rol) throw new RuntimeException('Falta rol Usuario');
        $input=$_POST; $input['rol_id']=(string)$rol;
        $errors=(new Usuarios($db))->guardar($input);
        if (!$errors) { header('Location: login.php?registrado=1',true,303); exit; }
        http_response_code(in_array('Este valor ya está registrado por otro usuario.', $errors, true) ? 409 : 400);
    } catch(Throwable $e) { error_log((string)$e); http_response_code(500); $errors=['No se pudo crear la cuenta. Intentá nuevamente.']; }
}
?>
<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Registro · Aura Studio</title><link rel="stylesheet" href="styles.css"></head><body><header><a class="brand" href="../../index.html">Aura Studio</a></header><main class="login-main"><h1>Crear cuenta</h1><form method="post" class="card form-card"><input type="hidden" name="csrf" value="<?=e($_SESSION['csrf'])?>">
<?php foreach($errors as $error): ?><p class="error-summary" role="alert"><?=e($error)?></p><?php endforeach; ?>
<?php foreach(['nombre'=>'Nombre','apellido'=>'Apellido','nickname'=>'Nickname','email'=>'Email','password'=>'Contraseña'] as $key=>$label): ?><div class="field"><label for="<?=e($key)?>"><?=e($label)?></label><input id="<?=e($key)?>" name="<?=e($key)?>" type="<?= $key==='password'?'password':($key==='email'?'email':'text')?>" required maxlength="<?= $key==='email'?254:($key==='nickname'?40:($key==='password'?72:80)) ?>" <?= $key==='password'?'minlength="8" autocomplete="new-password"':'' ?> value="<?= $key==='password'?'':e(is_string($_POST[$key]??null)?$_POST[$key]:'')?>"></div><?php endforeach; ?><div class="form-actions"><button>Registrarme</button><a href="login.php">Iniciar sesión</a></div></form></main></body></html>
