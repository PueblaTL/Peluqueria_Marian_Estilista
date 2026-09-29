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
    $repoSrv = new Servicios($db);
    $repoProf = new Profesionales($db);
    $repoRes = new Reservas($db);

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
    check($repo->guardar($user) === [], 'Alta válida de usuario');
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
    catch (PDOException $ex) { check(true, 'Rol referenciado protegido por RESTRICT'); }
    try { $db->exec('UPDATE usuarios SET rol_id = 9999'); check(false, 'Clave foránea obligatoria'); }
    catch (PDOException $ex) { check(true, 'Clave foránea obligatoria'); }
    check(count($repo->listar("' OR 1=1 --")) === 0, 'Búsqueda parametrizada');
    check(e('<script>') === '&lt;script&gt;', 'Escape HTML');
    check($repo->eliminar($id) && $repo->buscar($id) === null, 'Eliminación de usuario');
    check(!$repo->eliminar($id), 'Eliminación de registro inexistente');

    // Comprobaciones de Aura Studio (Servicios, Profesionales, Reservas)
    $servicios = $repoSrv->listar();
    check(count($servicios) === 5, 'Catálogo inicial de 5 servicios');
    $profesionales = $repoProf->listar();
    check(count($profesionales) === 4, 'Equipo inicial de 4 profesionales');

    // Alta de reserva
    $fechaPrueba = (new DateTimeImmutable('+2 days'))->format('Y-m-d');
    $reservaPayload = [
        'profesional_id' => 1,
        'servicio_id' => 2, // Balayage
        'fecha' => $fechaPrueba,
        'hora' => '10:00',
        'duracion_minutos' => 180,
        'precio_estimado' => 95000.00,
        'cliente_nombre' => 'Lucía',
        'cliente_apellido' => 'Méndez',
        'cliente_email' => 'lucia.mendez@example.com',
        'cliente_telefono' => '+54 9 11 5555-1234',
        'observaciones' => 'Primera visita para balayage'
    ];
    $resReserva = $repoRes->crear($reservaPayload);
    check($resReserva['success'] === true && $resReserva['id'] > 0, 'Creación de reserva en MySQL');

    // Intentar superposición de horario para el mismo profesional
    $reservaSuperpuesta = $reservaPayload;
    $reservaSuperpuesta['hora'] = '11:00'; // Se solapa con 10:00-13:00
    $resConflicto = $repoRes->crear($reservaSuperpuesta);
    check($resConflicto['success'] === false && isset($resConflicto['errors']['hora']), 'Prevención de solapamiento de turnos');

    // Integridad referencial: no se puede borrar el servicio referenciado
    try {
        $db->exec('DELETE FROM servicios WHERE id = 2');
        check(false, 'Servicio referenciado protegido');
    } catch (PDOException $ex) {
        check(true, 'Servicio con reservas protegido por RESTRICT');
    }

    // Integridad referencial: no se puede borrar el profesional referenciado
    try {
        $db->exec('DELETE FROM profesionales WHERE id = 1');
        check(false, 'Profesional referenciado protegido');
    } catch (PDOException $ex) {
        check(true, 'Profesional con reservas protegido por RESTRICT');
    }

    echo "$checks comprobaciones completadas con éxito.\n";
} finally {
    $db->exec("DROP DATABASE `$testName`");
}
