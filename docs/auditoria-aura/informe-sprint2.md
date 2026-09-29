# Informe Sprint 2 — Aura Studio

Fecha: 29/09/2026.

## Resultado y alcance de la verificación

Implementados registro público, login email/nickname, sesión PHP, autorización por rol, administrador demo, ABM de usuarios y reservas con MySQL como fuente de verdad. Conservados el landing y las reservas de invitados.

Se ejecutaron 52 comprobaciones exitosas: 24 por HTTP/PHP/MySQL, 21 de repositorios e integridad y 7 unitarias del frontend. No se utilizaron datos simulados para acreditar persistencia: las pruebas de integración crearon bases MySQL temporales e inspeccionaron las filas guardadas. El guardado de reservas ejecutó js/storage.js real con fetch hacia PHP.

La verificación visual NO se considera completa. El navegador integrado mostró el login y el catálogo proveniente de MySQL y permitió seleccionar una tarjeta; al accionar los botones de envío/avance no se observó la navegación esperada. No se identificó la causa ni se atribuye como hecho al navegador o a la aplicación. No hubo otro navegador conectado disponible. Los mismos endpoints y redirecciones sí pasaron por HTTP. Falta repetir los recorridos completos con interacción de usuario en Chrome/Edge y comprobar móvil. No se afirma que los doce escenarios hayan sido aprobados visualmente de punta a punta.

| Flujo | Estado comprobado |
|---|---|
| Registro | OK por formulario HTTP + fila MySQL + hash + rol Usuario |
| Login normal | OK por HTTP, contraseña incorrecta rechazada y nickname correcto aceptado |
| Login admin demo | OK por POST con CSRF, cuenta de BD y sesión real |
| Sesión | OK: datos, regeneración del identificador y logout |
| Protección Panel Admin | OK: redirección anónima; 403 para Usuario en panel y API |
| Listado Usuarios | OK: HTML generado desde MySQL |
| Alta Usuario | OK: formulario HTTP y persistencia |
| Edición Usuario | OK: UPDATE y conservación del hash con contraseña vacía |
| Eliminación Usuario | OK: DELETE; autoeliminación rechazada |
| Crear Reserva | OK: JavaScript real → HTTP → PHP → MySQL |
| Persistencia Reserva | OK: consulta independiente y nueva carga del listado |
| Listado Reservas Admin | OK: reserva aparece en HTML autenticado |
| Estado Reserva | OK: confirmación persistida y renderizada |
| Recorrido visual completo | PENDIENTE: interacción con botones no verificada exitosamente |

## Hallazgos corregidos

- Login anterior separado en administradores, sin relación con los roles de usuarios.
- Usuarios sin contraseña y ausencia de registro público.
- Configuración de ejemplo apuntaba a peluqueria_abm, donde faltaban reservas.
- El instalador SQL cambiaba de base pese a ABM_DB_NAME, incluso en pruebas. Ahora las pruebas se aíslan correctamente.
- Reservas podían confirmarse sólo en localStorage ante una falla de red.
- Precio y duración enviados por el cliente podían alterar la reserva; ahora prevalece el servicio de MySQL.
- Faltaban validación de apertura/horario al guardar y serialización por profesional.
- El catálogo SQL no coincidía con el landing. Se añadieron claves públicas estables; nunca se convierten arbitrariamente a IDs MySQL.
- js/data.js tenía un fragmento huérfano de Academia que impedía parsear el archivo. Se quitó ese fragmento sin alterar las cinco secciones del landing.
- Campos de cliente y catálogo interpolados en HTML se escapan en el asistente.

## Archivos modificados en esta intervención

- abm/README.md
- abm/config/database.example.php
- abm/database/install.php
- abm/database/schema.sql
- abm/public/index.php
- abm/public/login.php
- abm/public/styles.css
- abm/public/demo_login.php (ya existía sin seguimiento al comenzar)
- abm/public/api_estado_reserva.php (ya existía sin seguimiento al comenzar)
- abm/src/auth.php
- abm/src/bootstrap.php
- abm/src/Reservas.php
- abm/tests/auth.cjs
- abm/tests/run.php
- api/reservas.php
- docs/auditoria-aura/schema.sql
- js/data.js
- js/reservas.js
- js/storage.js
- tests/calendar.test.cjs

## Archivos creados

- abm/database/migrate.php
- abm/database/catalogo.sql
- abm/public/registro.php
- abm/public/cuenta.php
- abm/tests/db-check.php (sólo CLI)
- abm/tests/integration.cjs
- docs/auditoria-aura/informe-sprint2.md

index.html y css/reservas.css ya tenían cambios locales y no fueron modificados por esta intervención. Se preservaron los cambios previos del resto de los archivos, adaptándolos donde el flujo lo requería.

## Base de datos

Se aplicó la migración a aura_studio sin borrar usuarios, reservas, servicios ni profesionales existentes.

- usuarios: password_hash VARCHAR(255) NULL, intentos INT DEFAULT 0 y bloqueado_hasta DATETIME NULL. El NULL permite conservar cuentas antiguas sin inventar contraseñas; antes de usarlas deben recibir contraseña desde el ABM. Las altas nuevas siempre generan password_hash().
- roles: se garantiza Administrador y Usuario, conservando Operador y Consulta existentes. Rol obligatorio mediante usuarios.rol_id → roles.id, ON DELETE RESTRICT.
- servicios y profesionales: clave VARCHAR(40) NULL UNIQUE para vincular enlaces públicos del landing con IDs reales de BD.
- reservas: se conserva el esquema de invitados, sin agregar usuario_id. FK servicio_id → servicios.id y profesional_id → profesionales.id con RESTRICT.
- Administrador demo: admin@aurastudio.local, nickname admin_demo, rol consultado por nombre en BD; contraseña aleatoria hasheada, sin contraseña conocida publicada. El endpoint POST habilitado controla el acceso demo.
- Se conserva administradores para migrar la cuenta previa; el login nuevo consulta usuarios/roles.
- Instalación limpia: cinco servicios y cuatro profesionales correspondientes a Aura Studio. Migración existente: agrega el catálogo sin borrar los registros previos, que pueden seguir visibles en el selector.
- SQL de entrega incluye CREATE DATABASE IF NOT EXISTS y USE; orden de tablas compatible con FK. Instalador CLI respeta la base configurada.

## Ejecución reproducible

Desde la raíz del proyecto:

```powershell
php abm/tests/run.php
node abm/tests/integration.cjs
node --test tests/calendar.test.cjs
```

También pasaron el lint de todos los PHP y node --check en todos los JavaScript de js/.

Para una BD vacía: php abm/database/install.php. Para una existente: php abm/database/migrate.php. No ejecutar install.php sobre tablas ya creadas.

Servidor local: php -S 127.0.0.1:18090 -t .
Login: http://127.0.0.1:18090/abm/public/login.php

## Comprobación visual pendiente

1. Abrir el login en un navegador normal; registrar una cuenta e iniciar sesión primero con contraseña incorrecta y luego correcta.
2. Con Usuario, abrir directamente el panel y comprobar 403; cerrar sesión.
3. Pulsar Ingresar como administrador de prueba; crear, editar con contraseña vacía y eliminar un usuario de prueba.
4. Desde el landing, abrir una reserva para cada enlace de profesional; verificar que servicio y profesional seleccionados coinciden con el enlace.
5. Elegir fecha futura, horario y datos de prueba, confirmar, recargar el panel y comprobar la reserva. Cambiar su estado y recargar nuevamente.
6. Repetir login, ABM y reservas en ancho móvil. La CSS incluye reglas responsive, pero no se acreditó visualmente este recorrido.

## Configuración de demostración

AURA_DEMO_LOGIN=0 deshabilita el botón y endpoint. Por defecto sólo funciona desde localhost. AURA_DEMO_LOGIN=1 habilita expresamente acceso sin contraseña para la demostración universitaria. No se incorporaron Composer, Vendor, Mailer, cursos ni certificados.
