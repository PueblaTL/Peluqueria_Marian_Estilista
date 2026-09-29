<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/auth.php';
requireLogin();
try {
    $db = database();
    $repo = new Usuarios($db);
} catch (Throwable $ex) {
    error_log((string) $ex);
    http_response_code(500);
    exit('No se pudo conectar a MySQL. Verificá la configuración y ejecutá php abm/database/install.php.');
}
$action = is_string($_GET['action'] ?? null) ? $_GET['action'] : 'list';
if (!in_array($action, ['list', 'create', 'edit', 'delete', 'roles', 'reservas'], true)) { http_response_code(404); exit('Página no encontrada.'); }
$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null;
$data = ['nombre' => '', 'apellido' => '', 'nickname' => '', 'email' => '', 'rol_id' => ''];
if (in_array($action, ['edit', 'delete'], true)) {
    $data = $id ? $repo->buscar($id) : null;
    if (!$data) { http_response_code(404); exit('Usuario no encontrado.'); }
}
$errors = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['csrf'], $_POST['csrf'])) { http_response_code(403); exit('Formulario vencido o inválido. Volvé a cargar la página.'); }
    if ($action === 'reservas' && isset($_POST['reserva_id'], $_POST['nuevo_estado'])) {
        $resId = (int) $_POST['reserva_id'];
        $nEstado = (string) $_POST['nuevo_estado'];
        $repoRes = new Reservas($db);
        $repoRes->cambiarEstado($resId, $nEstado);
        $_SESSION['flash'] = 'Estado de la reserva actualizado a ' . e($nEstado) . '.';
        header('Location: index.php?action=reservas', true, 303);
        exit;
    } elseif ($action === 'delete') {
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
$titles = ['list' => 'Usuarios', 'create' => 'Nuevo usuario', 'edit' => 'Editar usuario', 'delete' => 'Eliminar usuario', 'roles' => 'Roles', 'reservas' => 'Reservas de Turnos'];
?>
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title><?= e($titles[$action]) ?> · Aura Studio</title><link rel="stylesheet" href="styles.css"></head>
<body>
<header><a class="brand" href="index.php">A<span>Aura Studio<small>Administración · Gestión Integral</small></span></a><nav aria-label="Principal"><a href="index.php" <?= !in_array($action, ['roles', 'reservas'], true) ? 'aria-current="page"' : '' ?>>Usuarios</a><a href="?action=roles" <?= $action === 'roles' ? 'aria-current="page"' : '' ?>>Roles</a><a href="?action=reservas" <?= $action === 'reservas' ? 'aria-current="page"' : '' ?>>Reservas</a><form method="post" action="logout.php"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>"><button type="submit">Cerrar sesión</button></form></nav></header>
<main>
<div class="heading"><div><p class="eyebrow">GESTIÓN DEL SALÓN</p><h1><?= e($titles[$action]) ?></h1><p class="muted"><?= $action === 'reservas' ? 'Turnos solicitados en tiempo real desde la web de Aura Studio.' : ($action === 'list' ? 'Administrá los datos y el rol de cada usuario.' : 'Cada usuario está asociado a un único rol.') ?></p></div><?php if ($action === 'list'): ?><a class="button" href="?action=create">+ Nuevo usuario</a><?php elseif ($action === 'reservas'): ?><a class="button" href="../../pages/reservas.html" target="_blank">Nueva reserva ↗</a><?php endif; ?></div>
<?php if ($flash): ?><div class="notice" role="status"><?= e($flash) ?></div><?php endif; ?>
<?php if ($action === 'list'): $usuarios = $repo->listar($query); ?>
<section class="card"><form class="search" method="get"><label for="q">Buscar usuarios</label><div class="search-row"><input id="q" name="q" value="<?= e($query) ?>" placeholder="Nombre, apellido, nickname o email"><button type="submit">Buscar</button><?php if ($query !== ''): ?><a href="index.php">Limpiar</a><?php endif; ?></div></form>
<p class="count"><?= count($usuarios) ?> <?= count($usuarios) === 1 ? 'usuario' : 'usuarios' ?><?= $query !== '' ? ' encontrados' : ' registrados' ?></p>
<?php if (!$usuarios): ?><div class="empty"><h2><?= $query !== '' ? 'No hay coincidencias' : 'Todavía no hay usuarios' ?></h2><p><?= $query !== '' ? 'Probá con otro nombre o email.' : 'Creá el primer usuario para comenzar.' ?></p><?php if ($query === ''): ?><a class="button" href="?action=create">Crear usuario</a><?php endif; ?></div><?php else: ?>
<div class="table-wrap"><table><thead><tr><th>Nombre y apellido</th><th>Nickname</th><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead><tbody><?php foreach ($usuarios as $u): ?><tr><td><strong><?= e($u['nombre'] . ' ' . $u['apellido']) ?></strong></td><td>@<?= e($u['nickname']) ?></td><td><?= e($u['email']) ?></td><td><span class="badge"><?= e($u['rol']) ?></span></td><td class="actions"><a href="?action=edit&amp;id=<?= $u['id'] ?>" aria-label="Editar a <?= e($u['nickname']) ?>">Editar</a><a class="danger-link" href="?action=delete&amp;id=<?= $u['id'] ?>" aria-label="Eliminar a <?= e($u['nickname']) ?>">Eliminar</a></td></tr><?php endforeach; ?></tbody></table></div><?php endif; ?></section>
<?php elseif ($action === 'roles'): ?>
<section class="card"><p class="role-intro">Catálogo de roles disponibles. Un rol puede estar asignado a varios usuarios. Estos roles describen a los usuarios. El acceso al panel requiere la cuenta de administrador independiente.</p><div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Descripción</th></tr></thead><tbody><?php foreach ($roles as $rol): ?><tr><td><span class="badge"><?= e($rol['nombre']) ?></span></td><td><?= e($rol['descripcion']) ?></td></tr><?php endforeach; ?></tbody></table></div></section>
<?php elseif ($action === 'reservas'): 
    $repoRes = new Reservas($db);
    $reservas = $repoRes->listar(['q' => $query]);
?>
<section class="card">
<form class="search" method="get"><input type="hidden" name="action" value="reservas"><label for="q">Buscar reservas</label><div class="search-row"><input id="q" name="q" value="<?= e($query) ?>" placeholder="Clienta, teléfono o email"><button type="submit">Buscar</button><?php if ($query !== ''): ?><a href="?action=reservas">Limpiar</a><?php endif; ?></div></form>
<p class="count"><?= count($reservas) ?> <?= count($reservas) === 1 ? 'reserva' : 'reservas' ?><?= $query !== '' ? ' encontradas' : ' registradas en MySQL' ?></p>
<?php if (!$reservas): ?><div class="empty"><h2><?= $query !== '' ? 'No hay coincidencias' : 'Todavía no hay reservas en la base de datos' ?></h2><p><?= $query !== '' ? 'Probá con otro nombre o teléfono.' : 'Los turnos solicitados desde la web de reservas aparecerán aquí automáticamente.' ?></p><a class="button" href="../../pages/reservas.html" target="_blank">Abrir asistente de reservas</a></div><?php else: ?>
<div class="table-wrap"><table><thead><tr><th>Cita</th><th>Profesional</th><th>Servicio</th><th>Clienta</th><th>Contacto</th><th>Total</th><th>Estado</th><th>Acción</th></tr></thead><tbody><?php foreach ($reservas as $r): ?><tr><td><strong><?= e($r['fecha']) ?></strong><br><small><?= e(substr((string)$r['hora'], 0, 5)) ?> hs (<?= (int)$r['duracion_minutos'] ?>m)</small></td><td><?= e($r['profesional_nombre']) ?></td><td><strong><?= e($r['servicio_nombre']) ?></strong><br><small><?= e($r['servicio_categoria']) ?></small></td><td><?= e($r['cliente_nombre'] . ' ' . $r['cliente_apellido']) ?></td><td><?= e($r['cliente_telefono']) ?><br><small><?= e($r['cliente_email']) ?></small></td><td>$<?= number_format((float)$r['precio_estimado'], 0, ',', '.') ?></td><td><span class="badge"><?= e($r['estado']) ?></span></td><td><form method="post" style="display:inline-flex;gap:4px;"><input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>"><input type="hidden" name="reserva_id" value="<?= $r['id'] ?>"><?php if ($r['estado'] === 'Pendiente'): ?><button type="submit" name="nuevo_estado" value="Confirmado" style="font-size:0.75rem;padding:4px 8px;">Confirmar</button><button type="submit" name="nuevo_estado" value="Cancelado" class="danger" style="font-size:0.75rem;padding:4px 8px;">Cancelar</button><?php elseif ($r['estado'] === 'Confirmado'): ?><button type="submit" name="nuevo_estado" value="Completado" style="font-size:0.75rem;padding:4px 8px;">Completar</button><button type="submit" name="nuevo_estado" value="Cancelado" class="danger" style="font-size:0.75rem;padding:4px 8px;">Cancelar</button><?php else: ?><small class="muted">Finalizado</small><?php endif; ?></form></td></tr><?php endforeach; ?></tbody></table></div><?php endif; ?></section>
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
<footer>Proyecto ABM · PHP + MySQL</footer></main></body></html>
