<?php
/**
 * fix_passwords.php - Reparacion del Login - Marian Estilista
 * SOLO ENTORNO LOCAL - Eliminar despues de usar.
 * Acceder: http://localhost/peluqueria-portal/backend/config/fix_passwords.php
 */
$host = $_SERVER['HTTP_HOST'] ?? '';
if (!preg_match('#^(localhost|127\.0\.0\.1)(:\d+)?$#i', $host) && php_sapi_name() !== 'cli') {
    http_response_code(403); die('Acceso denegado.');
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';

header('Content-Type: text/html; charset=utf-8');
$db = Database::getConnection();

$users = [
    ['email' => 'admin@marianestilista.com', 'password' => 'Admin123!',   'rol' => 'ADMIN',    'nombre' => 'Marian',   'apellido' => 'Admin',      'telefono' => '2944000001'],
    ['email' => 'camila@gmail.com',          'password' => 'Cliente123!', 'rol' => 'CLIENTE',  'nombre' => 'Camila',   'apellido' => 'Gonzalez',   'telefono' => '2944123456'],
    ['email' => 'valentina@gmail.com',       'password' => 'Cliente123!', 'rol' => 'CLIENTE',  'nombre' => 'Valentina','apellido' => 'Rodriguez',  'telefono' => '2944654321'],
];

$results = [];
foreach ($users as $u) {
    $stmt = $db->prepare("SELECT id, password, email_verificado, activo FROM usuarios WHERE email = ? LIMIT 1");
    $stmt->execute([$u['email']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        $hash = password_hash($u['password'], PASSWORD_DEFAULT);
        $db->prepare("INSERT INTO usuarios (nombre,apellido,email,password,telefono,rol,email_verificado,activo) VALUES (?,?,?,?,?,?,1,1)")
           ->execute([$u['nombre'],$u['apellido'],$u['email'],$hash,$u['telefono'],$u['rol']]);
        $results[] = ['email'=>$u['email'],'action'=>'CREADO','ok'=>true];
    } else {
        $hashOk = password_verify($u['password'], $row['password']);
        $needFix = !$hashOk || !$row['email_verificado'] || !$row['activo'];
        if ($needFix) {
            $newHash = $hashOk ? $row['password'] : password_hash($u['password'], PASSWORD_DEFAULT);
            $db->prepare("UPDATE usuarios SET password=?,email_verificado=1,token_verificacion=NULL,token_expiracion=NULL,activo=1 WHERE id=?")
               ->execute([$newHash, $row['id']]);
            $results[] = ['email'=>$u['email'],'action'=>'REPARADO','hash'=>!$hashOk,'ver'=>!$row['email_verificado'],'ok'=>true];
        } else {
            $results[] = ['email'=>$u['email'],'action'=>'OK','ok'=>true];
        }
    }
}
?>
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Fix Login</title>
<style>body{font-family:monospace;background:#0c0c0c;color:#eee;padding:30px}h1{color:#c5a880}.ok{color:#27ae60}.warn{color:#e67e22}table{border-collapse:collapse;width:100%}th,td{padding:10px;border-bottom:1px solid #333;text-align:left}th{color:#c5a880}.box{background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:20px 0}.del{border:1px solid #e74c3c;padding:15px;margin-top:20px;color:#e74c3c}</style>
</head><body>
<h1>Reparacion de Login - Marian Estilista</h1>
<table><thead><tr><th>Email</th><th>Accion</th><th>Estado</th></tr></thead><tbody>
<?php foreach ($results as $r): ?>
<tr>
  <td><?=htmlspecialchars($r['email'])?></td>
  <td class="<?=$r['action']==='OK'?'ok':'warn'?>"><?=htmlspecialchars($r['action'])?>
    <?php if(!empty($r['hash'])): ?><br><small>hash regenerado</small><?php endif?>
    <?php if(!empty($r['ver'])): ?><br><small>email_verificado activado</small><?php endif?>
  </td>
  <td class="ok">Correcto</td>
</tr>
<?php endforeach?>
</tbody></table>
<div class="box">
<h2>Credenciales de prueba</h2>
<ul>
<li><strong>ADMIN:</strong> admin@marianestilista.com / Admin123!</li>
<li><strong>CLIENTE 1:</strong> camila@gmail.com / Cliente123!</li>
<li><strong>CLIENTE 2:</strong> valentina@gmail.com / Cliente123!</li>
</ul>
<p>Todos tienen email_verificado=1 y activo=1.</p>
</div>
<div class="del"><strong>ELIMINA este archivo despues de usarlo.</strong> No debe existir en produccion.</div>
<p><a href="../../frontend/pages/login.html" style="color:#c5a880">Ir al Login</a></p>
</body></html>
