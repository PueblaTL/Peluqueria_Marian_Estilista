# Aura Studio — Sprint 2

Requiere PHP 8.1+ con pdo_mysql y mbstring, y MySQL/MariaDB (XAMPP compatible). No usa Composer.

## Ejecutar

Desde la raíz del proyecto:

```powershell
php abm/database/install.php
php -S 127.0.0.1:18090 -t .
```

Usar install.php sólo en una base vacía. Para una instalación existente:

```powershell
php abm/database/migrate.php
```

Configuración: abm/config/database.php si existe; en su defecto database.example.php. Variables ABM_DB_HOST, ABM_DB_PORT, ABM_DB_NAME, ABM_DB_USER y ABM_DB_PASSWORD. Base predeterminada: aura_studio. El instalador respeta ABM_DB_NAME; el SQL de entrega usa aura_studio.

Abrir /index.html, /abm/public/login.php o /abm/public/registro.php desde el servidor PHP. El panel está en /abm/public/index.php.

## Autenticación

Registro público asigna Usuario consultando roles. Login por email o nickname. Sesiones PHP con rotación del identificador, CSRF, cookie HttpOnly/SameSite y vencimiento por 30 minutos de inactividad. Se vuelve a consultar el rol en cada acceso protegido. Cinco intentos incorrectos bloquean la cuenta cinco minutos. El panel y el cambio de estado requieren Administrador.

El botón de administrador de prueba inicia una sesión real de admin@aurastudio.local. No tiene contraseña conocida ni credenciales en JavaScript. Se habilita por defecto sólo en localhost. AURA_DEMO_LOGIN=0 lo desactiva; AURA_DEMO_LOGIN=1 lo habilita expresamente para una demostración en otro entorno.

La migración conserva la tabla administradores e importa su cuenta anterior cuando no hay conflictos. Los usuarios antiguos sin contraseña deben recibir una desde el ABM antes de poder iniciar sesión. El administrador no puede eliminarse ni cambiar su propio rol. Contraseña vacía al editar conserva el hash.

## Reservas y catálogo

Las reservas siguen permitiendo clientes sin cuenta y conservan sus campos de contacto. No se agrega una FK de usuario que rompa ese flujo. Las FK de servicio y profesional usan RESTRICT. Precio y duración se toman siempre de MySQL. Se comprueban apertura, días, anticipación, solapamiento y el límite existente de dos turnos diarios por profesional. El bloqueo transaccional del profesional serializa las altas concurrentes.

Las claves públicas srv-* y prof-* vinculan los enlaces del landing con IDs reales, sin asumir IDs numéricos fijos. La migración añade el catálogo de Aura conservando los registros anteriores; esos registros pueden seguir apareciendo en el selector. El SQL desde cero incluye cinco servicios y cuatro profesionales de Aura.

No se guardan reservas ni catálogos en localStorage. Si falla el servidor, la interfaz muestra error. La consulta de reservas con datos personales queda en el panel autenticado.

Login, registro y ABM usan formularios PHP con redirección después de guardar. Las APIs de reservas consumidas por fetch devuelven JSON; no redirigen a HTML por falta de sesión.

## Pruebas

```powershell
php abm/tests/run.php
node abm/tests/integration.cjs
node --test tests/calendar.test.cjs
```

Las pruebas PHP/HTTP crean bases temporales separadas y las eliminan al terminar. La integración usa un servidor PHP temporal en 18089 y el módulo JavaScript real para guardar reservas en MySQL. Las pruebas unitarias del calendario y errores de red usan dobles de prueba y no sustituyen las pruebas de integración.

Ver docs/auditoria-aura/informe-sprint2.md para resultados y limitaciones de la verificación visual.
