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
foreach ([null, '', '2026-02-30', '2026-2-03', '9999-12-31', ['2026-09-15']] as $invalidDate) {
    rejected(fn() => $inscripciones->updateEstado($id, 'completado', $invalidDate), 400);
}
check($inscripciones->getById($id)['estado'] === 'Inscripto', 'Una fecha inválida cambió el estado.');
$completed = $inscripciones->updateEstado($id, 'Completado', date('Y-m-d'));
check($completed['estado'] === 'completado' && !empty($completed['fechaFinalizacion']), 'No se guardó completado/fecha.');
$completed = $inscripciones->updateEstado($id, 'completado', '2026-09-15');
check(substr($completed['fechaFinalizacion'], 0, 10) === '2026-09-15', 'No se guardó la fecha elegida.');
$cert = $service->generar($id);
$public = $cert->toPublicArray();
check(str_starts_with($cert->pdf(), '%PDF-'), 'PDF inválido.');
check(strlen($cert->pdf()) < 512 * 1024, 'El PDF con firma supera el presupuesto de 512 KiB.');
check(substr($public['fecha_finalizacion'], 0, 10) === '2026-09-15', 'El certificado no usa la fecha de la inscripción.');
$pdfText = '';
preg_match_all('/stream\r?\n(.*?)\r?\nendstream/s', $cert->pdf(), $streams);
foreach ($streams[1] as $stream) $pdfText .= @gzuncompress($stream) ?: $stream;
check(str_contains($pdfText, '15/09/2026'), 'El PDF no contiene la fecha elegida.');
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

$inscripciones->updateEstado($id, 'completado', '2026-09-14');
check(substr($inscripciones->getById($id)['fechaFinalizacion'], 0, 10) === '2026-09-14', 'No se pudo editar la fecha.');
check($service->validar($token)->toPublicArray() === $public, 'Editar inscripción cambió el certificado histórico.');
$inscripciones->updateEstado($id, 'Pendiente');
rejected(fn() => $service->generar($id), 409);
check($service->obtener($id)->pdf() === $cert->pdf(), 'Ver certificado debe seguir disponible.');
check(substr($inscripciones->getById($id)['fechaFinalizacion'], 0, 10) === '2026-09-14', 'El cambio de estado eliminó la fecha.');
$db->exec("UPDATE inscripciones_curso SET nombre='Nombre modificado' WHERE id=$id");
check($service->validar($token)->toPublicArray()['nombre_alumno'] === 'María José Álvarez', 'Se alteró el historial.');
$db->exec("UPDATE certificados SET estado='revocado'");
rejected(fn() => $service->validar($token), 404);
$db->exec("UPDATE certificados SET estado='valido'");
$inscripciones->delete($id);
check($service->validar($token)->toPublicArray() === $public, 'Eliminar inscripción destruye historial.');

$unknown = $inscripciones->create(['nombre'=>'Otro alumno', 'email'=>'otro@example.test', 'telefono'=>'12345678', 'cursoId'=>'desconocido', 'estado'=>'completado', 'fecha_finalizacion'=>'2026-09-15']);
rejected(fn() => $service->generar($unknown['id']), 409);
check(!$db->inTransaction(), 'La transacción quedó abierta.');
check((int)$db->query('SELECT COUNT(*) FROM certificados')->fetchColumn() === 1, 'Emisión parcial persistida.');

// Fixture para QA del PDF y pruebas HTTP; no se crea en producción.
rejected(fn() => $inscripciones->create(['nombre'=>'Sin fecha', 'email'=>'sinfecha@example.test', 'telefono'=>'12345678', 'estado'=>'completado']), 400);
$fixture = $inscripciones->create(['nombre'=>'María José', 'apellido'=>'Álvarez', 'email'=>'qa@example.test', 'telefono'=>'12345678', 'estado'=>'completado', 'fecha_finalizacion'=>'2026-09-15']);
$fixtureCert = $service->generar($fixture['id']);
if ($output = getenv('CERT_TEST_PDF')) file_put_contents($output, $fixtureCert->pdf());
echo "OK: migración, estados, rechazo backend, emisión, duplicados, historial, revocación, tokens y rollback.\n";
