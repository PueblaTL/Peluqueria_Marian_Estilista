<?php
// Ejecutar únicamente contra una base VACÍA y descartable cuyo nombre termine en _test.
// CERT_TEST_DSN=mysql:host=127.0.0.1;port=3308;dbname=marian_certificados_test;charset=utf8mb4
$dsn = getenv('CERT_TEST_DSN') ?: '';
if (!preg_match('/dbname=([a-zA-Z0-9_]+_test)(?:;|$)/', $dsn)) {
    throw new RuntimeException('Definí CERT_TEST_DSN con una base descartable terminada en _test.');
}
$db = new PDO($dsn, getenv('CERT_TEST_USER') ?: 'root', getenv('CERT_TEST_PASS') ?: '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if ($db->query('SHOW TABLES')->fetch()) throw new RuntimeException('La base de pruebas debe estar vacía.');
require_once __DIR__ . '/../services/CertificadoService.php';
require_once __DIR__ . '/../services/InscripcionService.php';
set_exception_handler(function (Throwable $error): void {
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
});
$connection = new ReflectionProperty(Database::class, 'connection');
$connection->setAccessible(true);
$connection->setValue(null, $db);

function check(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function rejected(callable $work, int $code): void {
    try { $work(); } catch (DomainException $e) {
        check($e->getCode() === $code, 'Código de rechazo incorrecto.');
        return;
    }
    throw new RuntimeException('Se esperaba rechazo del backend.');
}

// Reconstruir la tabla anterior y probar la migración con datos existentes.
$schema = file_get_contents(__DIR__ . '/../sql/schema.sql');
$start = strpos($schema, 'CREATE TABLE IF NOT EXISTS `inscripciones_curso`');
$end = strpos($schema, ';', $start);
$old = substr($schema, $start, $end - $start + 1);
$old = str_replace(", 'completado'", '', $old);
$old = preg_replace('/^.*`fecha_finalizacion`.*\R/m', '', $old);
$db->exec($old);
$db->exec("INSERT INTO inscripciones_curso (nombre, telefono, email, estado) VALUES ('Alumno previo', '12345678', 'previo@example.test', 'Contactado')");
$db->exec(file_get_contents(__DIR__ . '/../sql/migration_certificados.sql'));
check($db->query('SELECT estado FROM inscripciones_curso WHERE id=1')->fetchColumn() === 'Contactado', 'La migración alteró un estado existente.');

$inscripciones = new InscripcionService();
$service = new CertificadoService(new CertificadoRepository($db));
$ins = $inscripciones->create(['nombre' => 'María José', 'apellido' => 'Álvarez', 'telefono' => '2944123456', 'email' => 'alumna@example.test']);
$id = $ins['id'];
foreach (['Pendiente', 'Contactado', 'Inscripto'] as $estado) {
    $inscripciones->updateEstado($id, $estado);
    rejected(fn() => $service->generar($id), 409);
}
check((int)$db->query('SELECT COUNT(*) FROM certificados')->fetchColumn() === 0, 'Se emitió un certificado prematuro.');
$completed = $inscripciones->updateEstado($id, 'Completado');
check($completed['estado'] === 'completado' && !empty($completed['fechaFinalizacion']), 'No se guardó completado/fecha.');
$cert = $service->generar($id);
$public = $cert->toPublicArray();
check(str_starts_with($cert->pdf(), '%PDF-'), 'PDF inválido.');
check(strlen($cert->pdf()) < 256 * 1024, 'El PDF supera el presupuesto de 256 KiB para servidores con paquetes de 1 MiB.');
check($service->generar($id)->pdf() === $cert->pdf(), 'La emisión repetida cambió el PDF.');
check((int)$db->query('SELECT COUNT(*) FROM certificados')->fetchColumn() === 1, 'Certificado duplicado.');
check($inscripciones->getById($id)['certificadoCodigo'] === $public['codigo_certificado'], 'El listado no informa el certificado.');
$token = $db->query('SELECT token_validacion FROM certificados')->fetchColumn();
check(strlen($token) === 64, 'Token incorrecto.');
check($service->validar($token)->toPublicArray() === $public, 'Validación pública incorrecta.');
check(count($public) === 7 && !isset($public['inscripcion_id'], $public['email'], $public['token_validacion']), 'Exposición pública de datos internos.');
rejected(fn() => $service->validar(str_repeat('0', 64)), 404);
rejected(fn() => $service->validar("' OR 1=1"), 404);
rejected(fn() => $service->generar(999999), 404);

$inscripciones->updateEstado($id, 'Pendiente');
rejected(fn() => $service->generar($id), 409);
check($service->obtener($id)->pdf() === $cert->pdf(), 'Ver certificado debe seguir disponible.');
check($inscripciones->getById($id)['fechaFinalizacion'] === null, 'Fecha actual no restablecida.');
$db->exec("UPDATE inscripciones_curso SET nombre='Nombre modificado' WHERE id=$id");
check($service->validar($token)->toPublicArray()['nombre_alumno'] === 'María José Álvarez', 'Se alteró el historial.');
$db->exec("UPDATE certificados SET estado='revocado'");
rejected(fn() => $service->validar($token), 404);
$db->exec("UPDATE certificados SET estado='valido'");
$inscripciones->delete($id);
check($service->validar($token)->toPublicArray() === $public, 'Eliminar inscripción destruye historial.');

$unknown = $inscripciones->create(['nombre'=>'Otro alumno', 'email'=>'otro@example.test', 'telefono'=>'12345678', 'cursoId'=>'desconocido', 'estado'=>'completado']);
rejected(fn() => $service->generar($unknown['id']), 409);
check(!$db->inTransaction(), 'La transacción quedó abierta.');
check((int)$db->query('SELECT COUNT(*) FROM certificados')->fetchColumn() === 1, 'Emisión parcial persistida.');

// Fixture para QA del PDF y pruebas HTTP; no se crea en producción.
$fixture = $inscripciones->create(['nombre'=>'María José', 'apellido'=>'Álvarez', 'email'=>'qa@example.test', 'telefono'=>'12345678', 'estado'=>'completado']);
$fixtureCert = $service->generar($fixture['id']);
if ($output = getenv('CERT_TEST_PDF')) file_put_contents($output, $fixtureCert->pdf());
echo "OK: migración, estados, rechazo backend, emisión, duplicados, historial, revocación, tokens y rollback.\n";
