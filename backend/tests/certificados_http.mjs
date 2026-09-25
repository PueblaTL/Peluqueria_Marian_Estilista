import assert from 'node:assert/strict';

// Solo contra el servidor local de QA, con sesiones creadas en su carpeta temporal.
const base = process.env.CERT_TEST_BASE;
assert.match(base || '', /^http:\/\/127\.0\.0\.1:\d+$/);
const adminCookie = process.env.CERT_TEST_ADMIN_COOKIE;
const clientCookie = process.env.CERT_TEST_CLIENT_COOKIE;
assert.ok(adminCookie && clientCookie);
async function api(path, { cookie = adminCookie, body, method = body ? 'POST' : 'GET' } = {}) {
  const response = await fetch(`${base}/backend/api/${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const type = response.headers.get('content-type');
  return { status: response.status, data: type?.includes('application/json') ? await response.json() : await response.text() };
}
for (const [cookie, status] of [['', 401], [clientCookie, 403]]) {
  assert.equal((await api('certificados/generar.php', { cookie, body: { inscripcion_id: 1 } })).status, status);
  assert.equal((await api('certificados/obtener.php?inscripcion_id=1', { cookie })).status, status);
  assert.equal((await api('inscripciones/update_estado.php', { cookie, body: { id: 1, estado: 'completado' } })).status, status);
}
assert.equal((await api('certificados/generar.php')).status, 405);
assert.equal((await api('certificados/generar.php', { body: { inscripcion_id: [] } })).status, 400);
assert.equal((await api('certificados/validar.php?token[]=bad', { cookie: '' })).status, 404);
const created = await api('inscripciones/create.php', { body: { nombre: 'HTTP Test', email: `http-${Date.now()}@example.test`, telefono: '12345678' } });
assert.equal(created.status, 201);
const id = created.data.data.id;
for (const estado of ['Pendiente', 'Contactado', 'Inscripto']) {
  assert.equal((await api('inscripciones/update_estado.php', { body: { id, estado } })).status, 200);
  assert.equal((await api('certificados/generar.php', { body: { inscripcion_id: id, estado: 'completado' } })).status, 409);
}
assert.equal((await api('inscripciones/update_estado.php', { body: { id, estado: 'inventado' } })).status, 400);
assert.equal((await api('inscripciones/update_estado.php', { body: { id, estado: [] } })).status, 400);
const completed = await api('inscripciones/update_estado.php', { body: { id, estado: 'completado' } });
assert.equal(completed.data.data.estado, 'completado');
const generated = await api('certificados/generar.php', { body: { inscripcion_id: id, nombre_alumno: 'Falso' } });
assert.equal(generated.status, 200);
assert.equal(generated.data.data.nombre_alumno, 'HTTP Test');
const repeated = await api('certificados/generar.php', { body: { inscripcion_id: id } });
assert.equal(repeated.data.data.codigo_certificado, generated.data.data.codigo_certificado);
const pdf = await api(`certificados/obtener.php?inscripcion_id=${id}`);
assert.equal(pdf.status, 200);
assert.ok(pdf.data.startsWith('%PDF-'));
const rows = await api('inscripciones/list.php');
assert.ok(rows.data.data.find(row => row.id === id).certificadoCodigo);
await api('inscripciones/update_estado.php', { body: { id, estado: 'Inscripto' } });
assert.equal((await api('certificados/generar.php', { body: { inscripcion_id: id } })).status, 409);
assert.equal((await api(`certificados/obtener.php?inscripcion_id=${id}`)).status, 200);
const clientCreated = await api('inscripciones/create.php', { cookie: clientCookie, body: { estado: 'completado', nombre: 'Falso', email: 'falso@example.test', telefono: '12345678' } });
if (clientCreated.status === 201) assert.equal(clientCreated.data.data.estado, 'Pendiente');
else assert.equal(clientCreated.status, 409);
console.log('OK: HTTP permisos, métodos, estados manipulados, emisión, duplicados, descarga e historial.');
