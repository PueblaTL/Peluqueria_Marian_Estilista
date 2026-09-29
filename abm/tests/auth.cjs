const { spawn, execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const assert = require('node:assert/strict');

(async () => {
  const name = 'abm_auth_test_' + randomBytes(6).toString('hex');
  const env = { ...process.env, ABM_DB_NAME: name };
  execFileSync('php', ['abm/database/install.php'], { env });
  const server = spawn('php', ['-S', '127.0.0.1:18089', '-t', 'abm/public'], { env, stdio: ['ignore', 'ignore', 'pipe'] });
  let cookie = '';
  const request = async (path, body) => {
    const response = await fetch('http://127.0.0.1:18089/' + path, {
      method: body ? 'POST' : 'GET', redirect: 'manual', headers: { Cookie: cookie },
      body: body ? new URLSearchParams(body) : undefined,
    });
    const value = response.headers.get('set-cookie');
    if (value) cookie = value.split(';')[0];
    return { status: response.status, location: response.headers.get('location'), html: await response.text() };
  };
  const token = html => html.match(/name="csrf" value="([^"]+)"/)[1];
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.once('exit', code => reject(new Error('Servidor finalizado: ' + code)));
      server.stderr.once('data', resolve);
    });
    let page = await request('index.php?action=create');
    assert.equal(page.status, 303);
    assert.equal(page.location, 'login.php');
    page = await request('login.php');
    assert.match(page.html, /Creá tu cuenta inicial/);
    let csrf = token(page.html);
    assert.equal((await request('login.php', { csrf: 'incorrecto' })).status, 403);
    const password = randomBytes(20).toString('hex');
    const before = cookie;
    page = await request('login.php', { csrf, email: 'admin@example.com', password, confirmation: password });
    assert.equal(page.status, 303);
    assert.notEqual(cookie, before);
    page = await request('index.php');
    assert.equal(page.status, 200);
    assert.match(page.html, /Cerrar sesión/);
    csrf = token(page.html);
    assert.equal((await request('logout.php')).status, 405);
    assert.equal((await request('logout.php', { csrf: 'incorrecto' })).status, 403);
    assert.equal((await request('logout.php', { csrf })).status, 303);
    assert.equal((await request('index.php')).status, 303);
    page = await request('login.php');
    assert.doesNotMatch(page.html, /Creá tu cuenta inicial/);
    csrf = token(page.html);
    assert.equal((await request('login.php', { csrf, email: 'admin@example.com', password: 'incorrecta' })).status, 401);
    assert.equal((await request('login.php', { csrf, email: 'admin@example.com', password })).status, 303);
    page = await request('index.php');
    await request('logout.php', { csrf: token(page.html) });
    page = await request('login.php');
    csrf = token(page.html);
    for (let i = 0; i < 5; i++) assert.equal((await request('login.php', { csrf, email: 'admin@example.com', password: 'incorrecta' })).status, 401);
    assert.equal((await request('login.php', { csrf, email: 'admin@example.com', password })).status, 401);
    console.log('OK: alta inicial, protección ABM, CSRF, regeneración de sesión, login, logout y bloqueo de intentos.');
  } finally {
    server.kill();
    execFileSync('php', ['-r', `require 'abm/src/bootstrap.php'; database(false)->exec('DROP DATABASE ${name}');`], { env });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
