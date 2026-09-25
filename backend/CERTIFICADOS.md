# Certificados de cursos

## Actualización de una instalación existente

1. Ejecutar **una sola vez** `backend/sql/migration_certificados.sql` sobre la base existente, antes de publicar el código. Agrega `completado` al ENUM, `fecha_finalizacion` y la tabla `certificados`. No ejecutar `init_db.php` ni las semillas para actualizar producción.
2. Desde `backend`, ejecutar `composer install --no-dev --optimize-autoloader` usando el `composer.lock` incluido. Si el hosting no ofrece Composer, instalar localmente y subir también `backend/vendor/`. PHP debe ser 8.0 o posterior y disponer de PDO MySQL, mbstring, iconv, GD y las extensiones requeridas por Composer. ZIP se necesita para instalar paquetes, no para emitir certificados.
3. Publicar los archivos de esta funcionalidad, incluida la imagen `frontend/assets/images/logo_marianEstilista.png` que ya estaba presente en el directorio de trabajo, y `certificado.html` en la raíz del sitio. No publicar `scratch/` ni los fixtures de pruebas.
4. Configurar `APP_URL=https://marianestilista.online` (o la URL raíz real del despliegue, incluyendo subcarpeta si corresponde) antes de emitir: esa URL queda dentro del PDF histórico.
5. Verificar los datos oficiales de `backend/config/cursos.php`: el curso actual `cur-1` y el instructor Mariano. El cliente no puede sustituir estos datos al solicitar la emisión.

Para una base nueva, `backend/sql/schema.sql` ya contiene el esquema completo; no aplicar además la migración.

El PDF utiliza `backend/assets/logo-certificado.png`, una copia RGBA optimizada de 360 px del nuevo logo sin fondo. Publicar también este archivo. Conserva la transparencia y se imprime a 32 mm (aproximadamente 286 dpi). El PNG original sigue disponible para la página pública. El documento permanece por debajo de 256 KiB y evita el error MySQL 2006 al guardar con `max_allowed_packet=1 MiB`; no es necesario aumentar ese límite para estos certificados.

El diseño usa un degradado vectorial marfil/beige claro, marco fino, título serif, nombre destacado y separadores suaves. El QR mantiene 37 mm, negro sobre blanco y cuatro módulos de margen. Este rediseño se aplica únicamente a nuevas emisiones: los PDF históricos almacenados permanecen intactos.

## Comportamiento

- El selector **Estado actual** conserva Pendiente, Contactado e Inscripto y agrega **Completado**. En API y base se guarda exactamente `completado`; también se admite `Completado` como entrada de compatibilidad.
- Al entrar en ese estado se registra la fecha de finalización. Repetir el mismo estado conserva la fecha; salir de él borra la fecha de la inscripción actual. Los certificados ya emitidos mantienen sus fechas y datos originales.
- La generación toma un bloqueo `SELECT ... FOR UPDATE` sobre la inscripción, comprueba nuevamente `estado === 'completado'` y emite dentro de una transacción. La restricción UNIQUE sobre `inscripcion_id` impide duplicados. Una repetición devuelve el certificado existente; una petición con otro estado se rechaza incluso si ya existe uno.
- Se almacena el PDF junto con el nombre del alumno, curso, instructor y fechas. Así las descargas futuras reproducen el documento original. El alumno se vincula mediante la inscripción: este esquema no tiene una relación previa entre inscripciones y usuarios.
- El código visible utiliza año y 16 caracteres hexadecimales aleatorios, con índice único. La validación usa un token independiente de 32 bytes criptográficos, no el ID interno ni el código visible.
- Eliminar una inscripción conserva el certificado, con su relación puesta en NULL por la FK. Cambiar el estado de la inscripción tampoco revoca un documento ya emitido. Para revocar un certificado, un operador autorizado puede cambiar `certificados.estado` a `revocado`; no se agregó una interfaz de revocación porque no forma parte del flujo solicitado.
- La consulta pública muestra exclusivamente siete campos de acreditación. Tokens desconocidos, modificados o revocados producen “Certificado no válido”. No se aplica vencimiento. Los errores del servidor muestran un mensaje temporal sin información técnica.
- El PDF es A4 horizontal, con logo, fechas, firma/sello y QR vectorial generado localmente; no envía datos del alumno a proveedores QR.

## Endpoints

| Método | Ruta | Acceso |
| --- | --- | --- |
| POST | `/backend/api/inscripciones/update_estado.php` (`id`, `estado`) | Administrador |
| POST | `/backend/api/certificados/generar.php` (`inscripcion_id`) | Administrador |
| GET | `/backend/api/certificados/obtener.php?inscripcion_id=...` | Administrador; PDF inline, descargable desde el visor |
| GET | `/backend/api/certificados/validar.php?token=...` | Público; sin IDs, contactos ni PDF |

Página pública: `/certificado.html?token=...`.

## Archivos

Modificados: `backend/composer.json`, `backend/controllers/InscripcionController.php`, `backend/models/Inscripcion.php`, `backend/repositories/InscripcionRepository.php`, `backend/services/InscripcionService.php`, `backend/sql/schema.sql`, `frontend/css/admin.css`, `frontend/js/admin.js` y `frontend/pages/admin.html`.

Creados: `backend/composer.lock`, `backend/config/cursos.php`, `backend/models/Certificado.php`, `backend/repositories/CertificadoRepository.php`, `backend/services/CertificadoService.php`, `backend/services/CertificadoPdfService.php`, `backend/controllers/CertificadoController.php`, los tres endpoints en `backend/api/certificados/`, `backend/sql/migration_certificados.sql`, `certificado.html`, `frontend/js/certificado.js`, `frontend/css/certificado.css`, este documento y las pruebas de `backend/tests/`.

## Pruebas

`backend/tests/certificados_integration.php` exige una base **vacía, descartable y terminada en `_test`**, configurada mediante `CERT_TEST_DSN`, `CERT_TEST_USER` y `CERT_TEST_PASS`. Crea el esquema anterior, aplica la migración y prueba estados, rechazo del backend, snapshots, emisión, duplicados, tokens, revocación y rollback. Opcionalmente `CERT_TEST_PDF` guarda un PDF de QA. No usar una base real.

`node backend/tests/certificados_frontend.mjs` comprueba el selector, estados de botones, actualización inmediata, confirmación, escape de datos y errores de guardado.

`node backend/tests/certificados_http.mjs` requiere `CERT_TEST_BASE` (servidor en `127.0.0.1`), `CERT_TEST_ADMIN_COOKIE` y `CERT_TEST_CLIENT_COOKIE` de sesiones de QA. Comprueba métodos, autenticación, roles, datos manipulados, generación y descarga. La base debe contener las tablas y permitir crear inscripciones de prueba.

Verificación realizada localmente: PHP 8.2, MariaDB 10.4 en instancia aislada, pruebas HTTP y frontend, flujo en Chrome, validación pública a 390 px, PDF A4 de una página y decodificación del QR con coincidencia exacta de URL. No se aplicó la migración a producción.

Graphify: se intentaron `graphify query` y `graphify update .`, pero el ejecutable local falla con `uv trampoline failed to canonicalize script path`; el grafo no pudo actualizarse.
