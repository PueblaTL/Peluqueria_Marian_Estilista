const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const base = process.env.AURA_QA_URL || 'http://127.0.0.1:18091/aura-studio/';
let cookie = '', checks = 0;
function check(actual, expected, label) { assert.equal(actual, expected, label); console.log('OK: ' + label); checks++; }
function sql(query) {
  // Solo instancia aislada de pruebas; ninguna credencial de usuario.
  return execFileSync('php', [], { input: `<?php
  $db=new PDO('mysql:host=127.0.0.1;port=13316;dbname=aura_studio;charset=utf8mb4','root','',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
  ${query}`, encoding: 'utf8' }).trim();
}
async function request(path, data, method) {
  const r = await fetch(base + path, { method: method || (data ? 'POST' : 'GET'), redirect: 'manual', headers: { Cookie: cookie }, body: data ? new URLSearchParams(data) : undefined });
  const next = r.headers.get('set-cookie'); if (next) cookie = next.split(';')[0];
  return { status: r.status, html: await r.text(), location: r.headers.get('location') };
}
const token = page => page.html.match(/name="csrf" value="([^"]+)"/)[1];
async function main() {
  check((await request('')).status, 303, 'Entrada raíz');
  check((await request('abm/public/index.php')).status, 303, 'Panel protegido');
  for (const p of ['abm/config/database.example.php','abm/src/bootstrap.php','abm/var/']) check((await request(p)).status, 403, 'Apache bloquea ' + p);
  check((await request('abm/public/styles.css')).status, 200, 'CSS local');
  check((await request('abm/public/login.php', undefined, 'PUT')).status, 405, 'Método inválido');
  let page = await request('abm/public/login.php');
  check(page.status, 200, 'Formulario inicial');
  const password = randomBytes(20).toString('hex');
  check((await request('abm/public/login.php', { csrf: 'incorrecto' })).status, 403, 'CSRF login');
  check((await request('abm/public/login.php', { csrf: token(page), email: 'qa@example.test', password, confirmation: password })).status, 303, 'Alta administrador');
  check(sql("echo password_get_info($db->query('SELECT password_hash FROM administradores')->fetchColumn())['algoName'];"), 'bcrypt', 'Contraseña hasheada');
  page = await request('abm/public/index.php?action=create'); let csrf = token(page);
  const user = { csrf, nombre: 'Ana', apellido: 'Pérez', nickname: 'ana.qa', email: 'ana@example.test', rol_id: '1' };
  check((await request('abm/public/index.php?action=create', { ...user, csrf: 'bad' })).status, 403, 'CSRF alta');
  check((await request('abm/public/index.php?action=create', { ...user, nombre: '', email: 'bad', rol_id: '999' })).status, 422, 'Validaciones');
  check((await request('abm/public/index.php?action=create', user)).status, 303, 'Alta desde formulario HTTP');
  const id = sql("echo $db->query(\"SELECT id FROM usuarios WHERE nickname='ana.qa'\")->fetchColumn();");
  assert.match(id, /^\d+$/);
  check(sql("echo $db->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();"), '1', 'Persistencia MySQL');
  check((await request('abm/public/index.php?q=ana%40example.test')).html.includes('Ana Pérez'), true, 'Consulta/búsqueda');
  check((await request('abm/public/index.php?action=create', { ...user, email: 'ANA@example.test', nickname: 'ANA.QA' })).status, 422, 'Duplicados rechazados');
  check((await request('abm/public/index.php?action=edit&id='+id, { ...user, nombre: 'Ana María', rol_id: '2' })).status, 303, 'Modificación');
  check(sql("echo $db->query('SELECT rol_id FROM usuarios')->fetchColumn();"), '2', 'Cambio de rol persistido');
  check((await request('abm/public/index.php')).html.includes('Ana María'), true, 'Edición visible');
  check((await request('abm/public/index.php?q='+encodeURIComponent("' OR 1=1 --"))).html.includes('Ana María'), false, 'Consulta preparada');
  check(sql("try {$db->exec('DELETE FROM roles WHERE id=2'); echo 'fallo';} catch(PDOException $e) {echo $e->getCode();}"), '23000', 'RESTRICT rol asignado');
  check(sql("try {$db->exec('UPDATE usuarios SET rol_id=999'); echo 'fallo';} catch(PDOException $e) {echo $e->getCode();}"), '23000', 'FK impide huérfanos');
  check((await request('abm/public/index.php?action=edit&id=99999')).status, 404, 'ID inexistente');
  check((await request('abm/public/index.php?action=desconocida')).status, 404, 'Acción inexistente');
  check((await request('abm/public/index.php?action=roles')).html.includes('Operador'), true, 'Consulta roles');
  check((await request('abm/public/index.php?action=delete&id='+id)).status, 200, 'Confirmación baja');
  check(sql("echo $db->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();"), '1', 'GET no elimina');
  check((await request('abm/public/index.php?action=delete&id='+id, { csrf })).status, 303, 'Baja por POST');
  check(sql("echo $db->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();"), '0', 'Baja persistida');
  check((await request('abm/public/logout.php', { csrf })).status, 303, 'Logout');
  check((await request('abm/public/index.php')).status, 303, 'Sesión cerrada');
  page = await request('abm/public/login.php'); csrf = token(page);
  check((await request('abm/public/login.php', { csrf, email: 'qa@example.test', password })).status, 303, 'Login persistente');
  // Provocar error de consulta únicamente en la base aislada y restaurar en finally.
  sql("$db->exec('RENAME TABLE usuarios TO usuarios_qa_temporal');");
  try {
    page = await request('abm/public/index.php');
    check(page.status, 500, 'Error SQL devuelve HTTP 500');
    check(/SQLSTATE|SELECT|Stack trace/.test(page.html), false, 'No expone error SQL');
  } finally { sql("$db->exec('RENAME TABLE usuarios_qa_temporal TO usuarios');"); }
  console.log(`${checks} verificaciones aprobadas en Apache + MariaDB.`);
  fs.writeFileSync('scratch/qa-entrega/resultado.txt', `${checks} verificaciones aprobadas en Apache 2.4.58 + PHP 8.2.12 + MariaDB 10.4.32.\n`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
