<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__).'/src/bootstrap.php';
$operation=$argv[1] ?? '';
if ($operation==='inspect') {
$db=database();
echo json_encode(['users'=>$db->query('SELECT u.*,r.nombre rol FROM usuarios u JOIN roles r ON r.id=u.rol_id')->fetchAll(),'reservas'=>$db->query('SELECT * FROM reservas')->fetchAll()]);
} elseif($operation==='drop') {
$name=databaseConfig()['name'];
if (!preg_match('/^aura_integration_[a-f0-9]+$/',$name)) exit(1);
database(false)->exec("DROP DATABASE `$name`");
}
