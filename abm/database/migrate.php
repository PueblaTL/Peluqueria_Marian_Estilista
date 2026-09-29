<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once dirname(__DIR__) . '/src/bootstrap.php';
$db = database();
$columns = array_column($db->query('SHOW COLUMNS FROM usuarios')->fetchAll(), 'Field');
foreach (['password_hash' => 'VARCHAR(255) NULL', 'intentos' => 'INT NOT NULL DEFAULT 0', 'bloqueado_hasta' => 'DATETIME NULL'] as $column => $definition) {
    if (!in_array($column, $columns, true)) $db->exec("ALTER TABLE usuarios ADD COLUMN $column $definition");
}
$db->exec("INSERT IGNORE INTO roles (nombre, descripcion) VALUES ('Usuario','Cuenta de cliente del portal.'), ('Administrador','Acceso completo al panel.')");
// Conservar el acceso del administrador anterior, si existe.
$db->exec("INSERT IGNORE INTO usuarios (nombre,apellido,nickname,email,rol_id,password_hash) SELECT 'Administrador','Migrado','admin_migrado',a.email,r.id,a.password_hash FROM administradores a JOIN roles r ON r.nombre='Administrador'");
$stmt = $db->prepare("INSERT INTO usuarios (nombre,apellido,nickname,email,rol_id,password_hash) SELECT 'Administrador','Demo','admin_demo','admin@aurastudio.local',id,? FROM roles WHERE nombre='Administrador' AND NOT EXISTS (SELECT 1 FROM usuarios WHERE email='admin@aurastudio.local')");
$stmt->execute([password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT)]);
echo "Migración de autenticación aplicada sin borrar datos.\n";

foreach (['servicios','profesionales'] as $table) {
    $columns=array_column($db->query("SHOW COLUMNS FROM $table")->fetchAll(),'Field');
    if (!in_array('clave',$columns,true)) $db->exec("ALTER TABLE $table ADD COLUMN clave VARCHAR(40) NULL UNIQUE");
}
$db->exec(file_get_contents(__DIR__.'/catalogo.sql'));
