<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/bootstrap.php';
$db = database(false);
$testName = 'abm_test_' . bin2hex(random_bytes(6));
$db->exec("CREATE DATABASE `$testName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
try {
$db->exec("USE `$testName`");
$db->exec(file_get_contents(dirname(__DIR__) . '/database/schema.sql'));
$repo = new Usuarios($db);
$checks = 0;
function check(bool $condition, string $message): void {
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
    echo "OK: $message\n";
}
$roles = $repo->roles();
check(count($roles) === 3, 'Catálogo inicial de roles');
$user = ['nombre' => 'Ana', 'apellido' => 'Pérez', 'nickname' => 'ana.perez', 'email' => 'ana@example.com', 'rol_id' => (string) $roles[0]['id']];
check($repo->guardar($user) === [], 'Alta válida');
$id = (int) $repo->listar()[0]['id'];
check($repo->buscar($id)['apellido'] === 'Pérez', 'Persistencia y consulta');
check(count($repo->listar('ana@example.com')) === 1, 'Búsqueda por email');
$duplicate = $user;
$duplicate['nickname'] = 'ANA.PEREZ';
$duplicate['email'] = 'ANA@EXAMPLE.COM';
$errors = $repo->guardar($duplicate);
check(isset($errors['nickname'], $errors['email']), 'Duplicados sin distinción de mayúsculas');
$bad = ['nombre' => '', 'apellido' => '', 'nickname' => '!', 'email' => 'inválido', 'rol_id' => '9999'];
check(count($repo->guardar($bad)) === 5, 'Validación de todos los campos');
$user['rol_id'] = (string) $roles[1]['id'];
$user['nombre'] = 'Ana María';
check($repo->guardar($user, $id) === [], 'Edición conservando nickname y email propios');
check((int) $repo->buscar($id)['rol_id'] === (int) $roles[1]['id'], 'Cambio de rol');
$user['nickname'] = 'segunda';
$user['email'] = 'segunda@example.com';
check($repo->guardar($user) === [] && count($repo->listar()) === 2, 'Varios usuarios comparten un rol');
try { $db->exec('DELETE FROM roles WHERE id = ' . $roles[1]['id']); check(false, 'Rol referenciado protegido'); }
catch (PDOException $ex) { check(true, 'Rol referenciado protegido'); }
try { $db->exec('UPDATE usuarios SET rol_id = 9999'); check(false, 'Clave foránea obligatoria'); }
catch (PDOException $ex) { check(true, 'Clave foránea obligatoria'); }
check(count($repo->listar("' OR 1=1 --")) === 0, 'Búsqueda parametrizada');
check(e('<script>') === '&lt;script&gt;', 'Escape HTML');
check($repo->eliminar($id) && $repo->buscar($id) === null, 'Eliminación');
check(!$repo->eliminar($id), 'Eliminación de registro inexistente');
echo "$checks comprobaciones completadas.\n";

} finally {
    $db->exec("DROP DATABASE `$testName`");
}
