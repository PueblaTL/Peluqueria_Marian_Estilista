<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/auth.php';
if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST'], true)) {
    http_response_code(405); header('Allow: GET, POST'); exit('Método no permitido.');
}
requireLogin();
try {
    $repo = new Usuarios(database());
} catch (Throwable $ex) {
    error_log((string) $ex);
    http_response_code(500);
    exit('No se pudo conectar a MySQL. Verificá la configuración y importá base_de_datos.sql.');
}
$action = is_string($_GET['action'] ?? null) ? $_GET['action'] : 'list';
if (!in_array($action, ['list', 'create', 'edit', 'delete', 'roles'], true)) { http_response_code(404); exit('Página no encontrada.'); }
$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null;
$data = ['nombre' => '', 'apellido' => '', 'nickname' => '', 'email' => '', 'rol_id' => ''];
if (in_array($action, ['edit', 'delete'], true)) {
    $data = $id ? $repo->buscar($id) : null;
    if (!$data) { http_response_code(404); exit('Usuario no encontrado.'); }
}
$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['csrf'], $_POST['csrf'])) { http_response_code(403); exit('Formulario vencido o inválido. Volvé a cargar la página.'); }
    if ($action === 'delete') {
        $repo->eliminar($id);
        $_SESSION['flash'] = 'Usuario eliminado correctamente.';
    } elseif (in_array($action, ['create', 'edit'], true)) {
        $errors = $repo->guardar($_POST, $action === 'edit' ? $id : null);
        foreach ($data as $key => $value) if (isset($_POST[$key]) && is_string($_POST[$key])) $data[$key] = trim($_POST[$key]);
        if (!$errors) $_SESSION['flash'] = $action === 'create' ? 'Usuario creado correctamente.' : 'Cambios guardados correctamente.';
    } else { http_response_code(405); header('Allow: GET'); exit('Método no permitido.'); }
    if (!$errors) { header('Location: index.php', true, 303); exit; }
    http_response_code(422);
}
$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);
$query = is_string($_GET['q'] ?? null) ? trim($_GET['q']) : '';
$roles = $repo->roles();
$titles = ['list' => 'Usuarios', 'create' => 'Nuevo usuario', 'edit' => 'Editar usuario', 'delete' => 'Eliminar usuario', 'roles' => 'Roles'];
?>
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title><?= e($titles[$action]) ?> · Aura Studio</title><link rel="stylesheet" href="styles.css"></head>
<body>
<header><a class="brand" href="index.php">A<span>Aura Studio<small>Administración</small></span></a><nav aria-label="Principal"><a href="index.php" <?= $action !== 'roles' ? 'aria-current="page"' : '' ?>>Usuarios</a><a href="?action=roles" <?= $action === 'roles' ? 'aria-current="page"' : '' ?>>Roles</a><form method="post" action="logout.php"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>"><button type="submit">Cerrar sesión</button></form></nav></header>
<main>
<div class="heading"><div><p class="eyebrow">GESTIÓN DE ACCESOS</p><h1><?= e($titles[$action]) ?></h1><p class="muted"><?= $action === 'list' ? 'Administrá los datos y el rol de cada usuario.' : 'Cada usuario está asociado a un único rol.' ?></p></div><?php if ($action === 'list'): ?><a class="button" href="?action=create">+ Nuevo usuario</a><?php endif; ?></div>
<?php if ($flash): ?><div class="notice" role="status"><?= e($flash) ?></div><?php endif; ?>
<?php if ($action === 'list'): $usuarios = $repo->listar($query); ?>
<section class="card"><form class="search" method="get"><label for="q">Buscar usuarios</label><div class="search-row"><input id="q" name="q" value="<?= e($query) ?>" placeholder="Nombre, apellido, nickname o email"><button type="submit">Buscar</button><?php if ($query !== ''): ?><a href="index.php">Limpiar</a><?php endif; ?></div></form>
<p class="count"><?= count($usuarios) ?> <?= count($usuarios) === 1 ? 'usuario' : 'usuarios' ?><?= $query !== '' ? ' encontrados' : ' registrados' ?></p>
<?php if (!$usuarios): ?><div class="empty"><h2><?= $query !== '' ? 'No hay coincidencias' : 'Todavía no hay usuarios' ?></h2><p><?= $query !== '' ? 'Probá con otro nombre o email.' : 'Creá el primer usuario para comenzar.' ?></p><?php if ($query === ''): ?><a class="button" href="?action=create">Crear usuario</a><?php endif; ?></div><?php else: ?>
<div class="table-wrap"><table><thead><tr><th>Nombre y apellido</th><th>Nickname</th><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead><tbody><?php foreach ($usuarios as $u): ?><tr><td><strong><?= e($u['nombre'] . ' ' . $u['apellido']) ?></strong></td><td>@<?= e($u['nickname']) ?></td><td><?= e($u['email']) ?></td><td><span class="badge"><?= e($u['rol']) ?></span></td><td class="actions"><a href="?action=edit&amp;id=<?= $u['id'] ?>" aria-label="Editar a <?= e($u['nickname']) ?>">Editar</a><a class="danger-link" href="?action=delete&amp;id=<?= $u['id'] ?>" aria-label="Eliminar a <?= e($u['nickname']) ?>">Eliminar</a></td></tr><?php endforeach; ?></tbody></table></div><?php endif; ?></section>
<?php elseif ($action === 'roles'): ?>
<section class="card"><p class="role-intro">Catálogo de roles disponibles. Un rol puede estar asignado a varios usuarios. Estos roles describen a los usuarios. El acceso al panel requiere la cuenta de administrador independiente.</p><div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Descripción</th></tr></thead><tbody><?php foreach ($roles as $rol): ?><tr><td><span class="badge"><?= e($rol['nombre']) ?></span></td><td><?= e($rol['descripcion']) ?></td></tr><?php endforeach; ?></tbody></table></div></section>
<?php elseif ($action === 'delete'): ?>
<section class="card form-card"><h2>¿Eliminar este usuario?</h2><p>Vas a eliminar a <strong><?= e($data['nombre'] . ' ' . $data['apellido']) ?></strong> (@<?= e($data['nickname']) ?>).</p><p>Esta acción no se puede deshacer.</p><form method="post"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>"><div class="form-actions"><a class="secondary" href="index.php">Cancelar</a><button class="danger" type="submit">Sí, eliminar usuario</button></div></form></section>
<?php else: ?>
<form method="post" class="card form-card"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
<?php if ($errors): ?><div class="error-summary" role="alert"><strong>No se pudo guardar el usuario.</strong><p>Revisá los campos indicados. <?= e($errors['general'] ?? '') ?></p></div><?php endif; ?>
<p class="muted">Todos los campos son obligatorios.</p><div class="form-grid">
<?php foreach (['nombre' => 'Nombre', 'apellido' => 'Apellido', 'nickname' => 'Nickname / nombre de usuario', 'email' => 'Email'] as $campo => $label): ?>
<div class="field"><label for="<?= $campo ?>"><?= $label ?></label><input id="<?= $campo ?>" name="<?= $campo ?>" type="<?= $campo === 'email' ? 'email' : 'text' ?>" value="<?= e($data[$campo]) ?>" required maxlength="<?= $campo === 'email' ? 254 : ($campo === 'nickname' ? 40 : 80) ?>" <?= $campo === 'nickname' ? 'minlength="3" pattern="[a-zA-Z0-9_.\-]{3,40}"' : '' ?> <?= isset($errors[$campo]) ? 'aria-invalid="true" aria-describedby="error-' . $campo . '"' : '' ?>><?php if (isset($errors[$campo])): ?><small class="error" id="error-<?= $campo ?>"><?= e($errors[$campo]) ?></small><?php endif; ?></div>
<?php endforeach; ?>
<div class="field full"><label for="rol_id">Rol</label><select id="rol_id" name="rol_id" required <?= isset($errors['rol_id']) ? 'aria-invalid="true" aria-describedby="error-rol_id"' : '' ?>><option value="">Seleccioná un rol</option><?php foreach ($roles as $rol): ?><option value="<?= $rol['id'] ?>" <?= (string) $data['rol_id'] === (string) $rol['id'] ? 'selected' : '' ?>><?= e($rol['nombre']) ?></option><?php endforeach; ?></select><?php if (isset($errors['rol_id'])): ?><small class="error" id="error-rol_id"><?= e($errors['rol_id']) ?></small><?php endif; ?></div></div>
<div class="form-actions"><a class="secondary" href="index.php">Cancelar</a><button type="submit"><?= $action === 'create' ? 'Crear usuario' : 'Guardar cambios' ?></button></div></form>
<?php endif; ?>
<footer>Aura Studio · AMBC de usuarios · PHP + MySQL</footer></main></body></html>
