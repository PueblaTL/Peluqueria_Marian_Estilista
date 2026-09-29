# Auditoría de Aura Studio

Fecha: 29/09/2026. Alcance: archivos actuales del directorio de trabajo, incluidos cambios locales anteriores a esta auditoría. No se modificaron archivos funcionales ni se ejecutaron migraciones.

## 1. Conclusión y límites

El backend real está en `abm/`, no en `backend/` (vacío). Es un ABM PHP con MySQL que administra registros de usuarios y un catálogo de roles, protegido por una cuenta de administrador independiente. El portal público es HTML/JavaScript: reservas e inscripciones se guardan exclusivamente en localStorage. No existe una API REST real que conecte esas operaciones con MySQL.

El esquema versionado declara exactamente tres tablas: `administradores`, `roles`, `usuarios`. La conexión de lectura a MySQL falló con código 2002; no se pudo verificar versión instalada, tablas efectivas, índices efectivos, datos huérfanos ni divergencias de instalaciones anteriores. Todas las verificaciones SQL siguientes son contra `abm/database/schema.sql`, no contra una base en funcionamiento. No se inspeccionaron valores de sesiones ni datos personales guardados en navegadores. La búsqueda de credenciales cubre archivos actuales, no todo el historial Git.

Cursos y reservas **sí están usados actualmente**. No corresponde eliminarlos solo por provenir de Marian. La propuesta conserva estos flujos sin añadir certificados, pagos, puntos ni recuperación de contraseñas. Tampoco convierte toda la landing en un CMS.

## 2. Inventario y arquitectura actual

| Archivos | Responsabilidad y dependencias |
|---|---|
| `abm/src/bootstrap.php` | Configuración y fábrica PDO, escape HTML y clase `Usuarios`: consultas, validación y persistencia mezcladas |
| `abm/src/auth.php` | Sesiones en archivos, cabeceras, CSRF, autenticación y guardia de acceso; incluye bootstrap |
| `abm/public/index.php` | Controlador por parámetro `action`, formularios y vistas; llama a `Usuarios` |
| `abm/public/login.php` | Alta inicial, autenticación, SQL directo, transacciones, bloqueo y vista |
| `abm/public/logout.php` | POST con CSRF; borra sesión y cookie |
| `abm/config/database.example.php` | Variables ABM_DB_* con valores locales predeterminados; archivo privado alternativo `database.php`, ausente |
| `abm/database/schema.sql`, `install.php` | DDL y seed de tres roles; instalador CLI. No hay sistema de migraciones |
| `abm/tests/run.php`, `auth.cjs` | Pruebas de repositorio e integración HTTP, respectivamente, sobre bases temporales |
| `index.html`, `js/main.js` | Landing, contenido estático, filtros de galería, inscripción y contacto simulado |
| `pages/reservas.html`, `js/reservas.js` | Asistente de seis pasos; llama directamente a StorageService |
| `js/storage.js` | Lectura/escritura localStorage, disponibilidad y reglas de reserva |
| `js/data.js` | Fixtures de negocio, equipo, profesional, servicios, curso, galería, turnos e inscripciones |
| `js/api.js` | Fachada asíncrona sin HTTP, cargada por ambas páginas pero sin consumidores de sus clases en la UI |
| `tests/calendar.test.cjs` | Seis pruebas de calendario y almacenamiento simulado |
| CSS y `assets/images/` | Presentación; no acceden a MySQL |
| `gemini.md` | Documento heredado que todavía describe Marian, un solo estilista y otro catálogo; contradice Aura |
| `backend/`, `frontend/`, `scratch/`, `tmp/` | Sin archivos de backend adicionales encontrados. Directorios vacíos de pruebas antiguas de certificados no prueban tablas vigentes |

No hay controllers/services/repositories separados, ORM, entidades de framework, Spring Boot ni PostgreSQL implementados. No hay conexiones alternativas detectadas. Cada llamada a `database()` crea un PDO; el flujo ordinario abre uno por petición.

Arquitectura real:

```text
Portal HTML → JavaScript → StorageService → localStorage de ese navegador
Panel HTTP → index.php → Usuarios → PDO → MySQL
Login HTTP → login.php → PDO → MySQL + sesión PHP en archivos
```

## 3. Endpoints y consumidores

Las rutas PHP son relativas a la raíz pública del panel. Los enlaces de la landing incluyen `abm/public/`; necesitan una configuración de servidor coherente con las dos superficies.

| Ruta | Método / uso | Resultado |
|---|---|---|
| `login.php` | GET formulario, POST alta local/login | Usada desde ambas páginas públicas y guardia del panel |
| `index.php` o `?action=list&q=...` | GET | Listado/búsqueda autenticada |
| `index.php?action=create` | GET/POST | Alta desde listado |
| `index.php?action=edit&id=...` | GET/POST | Edición desde listado |
| `index.php?action=delete&id=...` | GET confirmación, POST borrado | Usada; GET no borra |
| `index.php?action=roles` | GET | Catálogo desde navegación |
| `logout.php` | POST | Formulario de cabecera; GET devuelve 405 |
| `database/install.php` | CLI solamente | No es endpoint público; por HTTP devuelve 404 |
| `/api/v1/servicios`, `/turnos`, `/curso`, `/clientes` | Solo comentarios en api.js | No existen endpoints HTTP equivalentes |

No se identificaron rutas PHP funcionales sin consumidor. `index.php` y `login.php` no rechazan explícitamente todos los verbos distintos de GET/POST; conviene devolver 405. No confundir funciones JavaScript exportadas con endpoints desplegados.

## 4. Hallazgos priorizados

| Prioridad | Evidencia | Impacto y recomendación |
|---|---|---|
| Alta | `js/reservas.js:504,596` interpola cliente/notas en innerHTML | Inyección HTML/DOM XSS al introducir marcado en nombre o notas. Es actualmente un flujo local, no está demostrado un ataque remoto entre usuarios. Construir nodos y usar textContent; revisar también catálogos editables y mensajes de error |
| Alta funcional | `js/main.js:480` | Contacto solo espera 600 ms y anuncia envío. Usar enlace WhatsApp con texto codificado y avisar que el usuario debe enviarlo; no crear tabla consultas sin bandeja ni necesidad de seguimiento |
| Alta funcional | `js/storage.js` y asistentes | Reservas e inscripciones no llegan al salón, no se comparten entre dispositivos y se pueden alterar. La persistencia central requiere endpoints y validación servidor; hasta entonces presentar como demostración local |
| Alta funcional | `StorageService.getDisponibilidad/saveTurno` | Agenda mezcla turnos de todos los profesionales; alta siempre asigna prof-1. El equipo no implica selección de profesional implementada. Resolver agenda por profesional, sin añadir una pantalla de selección innecesaria |
| Media | `abm/public/index.php` | Solo la apertura de conexión está dentro de try/catch; fallos de SELECT/DELETE y excepciones de guardar pueden propagarse. Si display_errors está habilitado, pueden mostrar SQL/rutas. Captura general, mensaje genérico y registro privado |
| Media | `abm/config/database.example.php` | Predetermina root sin contraseña. No se encontró una contraseña secreta no vacía hardcodeada. Reemplazar por usuario de aplicación con permisos mínimos y configuración explícita; separar privilegios del instalador |
| Media | `abm/public/login.php` | Alta inicial basada en REMOTE_ADDR local; detrás de proxy local podría interpretar clientes externos como locales. Mover provisión a CLI antes de publicar o configurar acceso local real |
| Media | `abm/src/auth.php` | Sesión guarda email y actividad, pero no reconsulta existencia del administrador; una revocación en BD no invalida sesiones ya abiertas. Considerarlo si se añade gestión de cuentas |
| Media | `js/reservas.js:16,520,608,624` | Mariano/Marian y dirección de Bariloche contradicen Aura/Valeria. Tomar identidad y dirección de una fuente única |
| Media | `js/storage.js` | IDs basados en los últimos seis dígitos de Date.now pueden repetirse. Guardado no es atómico entre pestañas; validación de disponibilidad no evita carreras. Usar PK SQL y transacción servidor |
| Media | `StorageService.saveInscripcion` | Ignora false de _setItem y devuelve éxito aun sin guardar. init también escribe sin captura de excepciones; limitar mensajes de éxito a escrituras confirmadas |
| Media | `js/data.js`, HTML y almacenamiento | Catálogos duplicados; precios estáticos, precioTexto y precio numérico pueden divergir. localStorage ya inicializado tampoco recibe cambios de seed |
| Baja | `bootstrap.php`, `index.php` | Validación y SQL juntos, consulta de roles repetida y CSRF duplicado pese a csrfValid. Separar solo lo necesario |
| Baja | `abm/README.md` | Diagrama omite administradores y representa creado_en como text; documentación de arquitectura incompleta |

Otros límites: fecha de fixtures usa UTC (`toISOString`) mientras agenda usa fecha local; cerca de medianoche puede diferir. Contraseñas hasheadas correctamente, pero un byte NUL puede hacer fallar password_hash con un error genérico. El bloqueo de la única cuenta puede utilizarse para denegar acceso temporal; verificar bloqueo antes de ejecutar hash costoso y limitar peticiones si se publica.

## 5. Tablas actuales y estructuras heredadas

| Estructura | Dependencias / función | Decisión |
|---|---|---|
| SQL `administradores` | login.php SELECT/INSERT/UPDATE; auth.php usa sesión derivada, no consulta tabla | Mantener: autentica al único administrador. CHECK id=1 explicita diseño singleton |
| SQL `roles` | Usuarios::roles/listar/guardar, vistas, seed y pruebas | Mantener por ABM académico. Roles descriptivos, no permisos efectivos |
| SQL `usuarios` | Todos los métodos de Usuarios y vistas/pruebas | Mantener por funcionalidad explícita Sprint 2. No son cuentas de login, no necesitan password_hash hoy. Solo eliminar junto al ABM si cambia ese requisito |
| localStorage servicios | seed → getServicios → asistente | Persistir centralmente si reservas dejan de ser demo; precio, categoría, duración, descripción e imagen tienen consumo |
| localStorage profesional/equipo | profesional sí se consulta al reservar; getEquipo no tiene consumidor UI | Unificar identidad en profesionales. No conservar dos registros del mismo prof-1 con textos distintos |
| localStorage turnos | disponibilidad, alta, resumen/confirmación | Mantener flujo y proponer reservas SQL; no es tabla SQL actual |
| localStorage curso/inscripciones | contenido HTML, main.js → saveInscripcion | Inscripción activa. Conservar cursos e inscripciones en propuesta central; parte del contenido del seed es duplicado sin lectura UI |
| Galería en HTML y seed | main.js filtra elementos HTML; SEED_DATA.galeria no es fuente de render | Mantener estática por ahora; trabajos SQL opcional, sin relaciones inventadas |
| localStorage negocio | getNegocio para agenda; mapa lee SEED_DATA directamente | Configuración estática suficiente; no necesita tabla negocio |
| Clientes derivados | getClientes agrupa por email; fachada sin consumidor | No crear tabla clientes ni relación a usuarios ABM. Datos de contacto por solicitud son instantáneas, no identidad autenticada |
| Certificados | Texto comercial de curso y nombres de carpetas vacías antiguas | No hay tabla, endpoint ni generación actual. No crear ni afirmar que se borró algo |
| Puntos, promociones, recuperación, verificación email | Sin implementación encontrada | No crear tablas; ninguna eliminación SQL justificada |

No se recomienda DROP de ninguna de las tres tablas existentes. Candidatos a limpieza posterior: fachadas api.js sin consumidores, métodos no usados (getClientes, getEquipo, getCursoInfo, getInscripciones, updateNegocio, updateTurnoEstado, deleteTurno, getTurnoById, getServicioById, resetToSeed) después de acordar el adaptador definitivo. Sus dependencias internas deben revisarse antes de borrar en bloque: getTurnos y getProfesional sí sostienen reservas.

`api.js` además referencia métodos inexistentes: saveServicio, updateServicio, deleteServicio, updateInscripcionEstado, deleteInscripcion y getDashboardStats. Fallarían al invocarlos. Hoy no son fallos del recorrido UI porque la UI evita esa fachada. Quitar promesas de endpoints futuros y documentación de Spring/PostgreSQL cuando se adopte PHP/MySQL.

## 6. Normalización, tipos e integridad actuales

Las tres tablas SQL tienen PK simples; sus campos son escalares (1FN), no tienen dependencias parciales de una clave compuesta (2FN), y rol se representa con FK sin duplicar nombre/descripcion en usuarios (3FN). El mismo email puede estar en administradores y usuarios: son dominios separados, no debe asumirse que identifica una misma cuenta. Si se unifican cuentas en el futuro habrá que migrar explícitamente.

Todos los campos de usuarios/roles son NOT NULL; bloqueado_hasta admite NULL correctamente. INT UNSIGNED alcanza para el volumen; TINYINT en administrador refleja una sola fila. VARCHAR acotados para texto corto, TIMESTAMP para creación, DATETIME para bloqueo. No existen precios SQL actuales: los números del seed no son columnas VARCHAR. precioTexto es una representación redundante, no debe migrarse como monto.

usuarios.email, usuarios.nickname, roles.nombre y administradores.email ya tienen UNIQUE; no añadir índices duplicados. La FK rol_id necesita índice y MySQL lo crea si falta. Un índice B-tree común no resuelve eficientemente búsquedas `%texto%` sobre cuatro campos; no añadir varios índices especulativos a un ABM pequeño. No hay paginación; añadirla solo al crecer los datos.

Única relación SQL actual: roles 1 → N usuarios; todo usuario tiene exactamente un rol. ON DELETE RESTRICT impide borrar un rol asignado; no se borra ningún usuario por borrar un catálogo. ON UPDATE omitido equivale al comportamiento restrictivo del motor. Borrar un usuario no afecta al administrador ni a reservas locales, porque no existe esa relación. Profesionales, servicios, trabajos y reservas no tienen FK efectiva hoy.

Arrays JSON como diasApertura, contenidos y detalles no son tablas relacionales: no declarar que cumplen 1FN SQL. No trasladarlos a cadenas separadas por comas. Se mantienen como contenido/configuración; si se necesitaran consultas por día/tema se modelarían tablas hijas. servicioNombre/profesionalNombre duplican datos maestros en turnos; quitar esas copias en el modelo propuesto. Precio y duración de una reserva son instantáneas de la oferta aceptada y sí justifican conservar valores históricos.

## 7. Seguridad

Las entradas SQL del ABM usan prepare/execute con emulación desactivada. El identificador dinámico `$campo` procede de una lista literal nickname/email, no del cliente; el nombre de base del instalador pasa regex estricta. SQL literal sin entrada externa no requiere placeholders. No se encontró una inyección SQL directa en consultas actuales. La validación de formato complementa, pero no reemplaza, la parametrización.

Usuarios valida longitudes, email, nickname y existencia del rol; UNIQUE y FK cierran carreras que las consultas previas por sí solas no impedirían. Se hacen consultas aun con datos inválidos: simplificación posible con retorno temprano. El catch 23000 agrupa duplicados/FK con mensaje seguro.

Login usa password_hash/PASSWORD_DEFAULT y password_verify; no almacena contraseña en claro. Solo administradores tiene hash. Hay CSRF, cookie HttpOnly/SameSite=Lax, Secure condicionado a HTTPS, modo estricto, regeneración de ID, 30 minutos de inactividad y logout POST. Las vistas PHP escapan con htmlspecialchars. Las cabeceras CSP se aplican al panel, no al portal estático.

Autorización real: requireLogin permite todas las acciones a la cuenta administradora. No hay RBAC por roles de usuarios y la propia vista lo aclara. No presentar Operador/Consulta como accesos restringidos que ya funcionen.

database.php y sesiones están ignorados por Git; el primero no existe en esta copia. No mostrar sesiones ni publicar abm/var, configuración o logs. La raíz abm/public recomendada protege internos, pero la landing está fuera: para servir ambos se necesitan ubicaciones/rutas explícitas que ejecuten PHP y nieguen internos. Un servidor estático no procesa login.php; no basta servir toda la raíz indiscriminadamente. No se verificó la configuración de despliegue efectiva.

## 8. Matriz de todas las consultas SQL

Estado `OK estático`: tabla/columnas/tipos presentes en el schema versionado; ejecución real pendiente. No implica instalación correcta.

| Backend / ubicación | Tabla o ámbito | Operación y columnas | Estado |
|---|---|---|---|
| Usuarios::listar | usuarios JOIN roles | SELECT u.*, r.nombre; JOIN rol_id=id; filtro nombre/apellido/nickname/email; orden apellido/nombre/id | OK estático, FK existente |
| Usuarios::buscar | usuarios | SELECT * WHERE id=? | OK estático, INT |
| Usuarios::roles | roles | SELECT * ORDER BY nombre | OK estático |
| Usuarios::guardar, chequeo nickname | usuarios | SELECT id WHERE nickname=:valor AND id<>:id | OK estático |
| Usuarios::guardar, chequeo email | usuarios | SELECT id WHERE email=:valor AND id<>:id | OK estático |
| Usuarios::guardar, alta | usuarios | INSERT nombre,apellido,nickname,email,rol_id | OK estático; id/creado_en tienen default |
| Usuarios::guardar, edición | usuarios | UPDATE mismos cinco campos WHERE id | OK estático |
| Usuarios::eliminar | usuarios | DELETE WHERE id | OK estático |
| login.php:13 | administradores | SELECT * WHERE id=1 | OK estático |
| login.php:24 | administradores | INSERT id,email,password_hash | OK estático; defaults para intentos/bloqueo |
| login.php:35 | administradores | SELECT *, bloqueado_hasta>NOW() AS bloqueado FOR UPDATE | OK estático, dentro de transacción |
| login.php:40 | administradores | UPDATE intentos, bloqueado_hasta con IF/DATE_ADD | OK estático, INT/DATETIME |
| login.php:47 | administradores | UPDATE intentos=0,bloqueado_hasta=NULL | OK estático |
| install.php:8-10 | base configurada | CREATE DATABASE, USE, ejecución schema | OK estático; requiere permisos DDL |
| schema.sql | tres tablas | CREATE TABLE IF NOT EXISTS, PK/UK/FK/CHECK | Coherente; IF NOT EXISTS no migra tablas antiguas |
| schema.sql:27 | roles | INSERT nombre,descripcion ON DUPLICATE KEY UPDATE nombre | OK estático; no actualiza descripcion en reinstalación |
| tests/run.php | base temporal aleatoria | CREATE DATABASE, USE, ejecutar schema, DROP en finally | Infraestructura de test, sin tabla de negocio extra |
| tests/run.php:39 | roles | DELETE WHERE id obtenido de BD | Prueba negativa de RESTRICT |
| tests/run.php:41 | usuarios | UPDATE rol_id=9999 | Prueba negativa de FK |
| tests/auth.cjs | base temporal aleatoria | install.php y DROP DATABASE final vía PHP | Prueba aislada, no endpoint |

Las pruebas de FK capturan cualquier PDOException; mejor comprobar SQLSTATE específico para que un error distinto no dé falso positivo. El instalador con IF NOT EXISTS no demuestra equivalencia entre tabla existente y DDL: se requiere SHOW CREATE TABLE en la siguiente verificación.

## 9. Modelo mínimo recomendado

Separar dos alcances: **hoy**, tres tablas para el ABM y portal demostrativo; **destino propuesto**, ocho tablas para conservar las funciones actuales con persistencia real. `schema.sql` en esta carpeta describe ese destino, no se conecta automáticamente con el frontend. Si el alcance final se limita a la landing informativa, no hacen falta tablas de contenido; habría que retirar explícitamente los flujos de reservas/inscripción. No se supone esa decisión.

Todas las PK propuestas son id; campos obligatorios salvo indicación NULL. Los tipos y restricciones exactos están en el SQL.

| Tabla necesaria en destino | Propósito y campos | Claves/restricciones |
|---|---|---|
| administradores | id, email, password_hash, intentos, bloqueado_hasta NULL | PK id=1, email UNIQUE, contador no negativo; sin FK |
| roles | id, nombre, descripcion | PK, nombre UNIQUE; mantiene catálogo académico |
| usuarios | id, nombre, apellido, nickname, email, rol_id, creado_en | PK; nickname/email UNIQUE; FK roles RESTRICT |
| profesionales | id, nombre (nombre completo) | PK; identidad que usa cada reserva; sin nombre UNIQUE: homónimos válidos |
| servicios | id, nombre, categoria, descripcion, precio_desde, precio_hasta NULL, duracion_minutos, imagen, activo | PK; DECIMAL(10,2), límites no negativos y ordenados; duración positiva; activo 0/1 |
| reservas | id, profesional_id, servicio_id, fecha, hora, duracion_minutos, precio_estimado, estado, cliente_nombre, cliente_apellido, cliente_email, cliente_telefono, observaciones NULL, creado_en | PK, dos FK RESTRICT; estados cerrados; precio/duración válidos |
| cursos | id, nombre | PK; identifica curso de inscripción. Resto del contenido permanece estático |
| inscripciones | id, curso_id, nombre_completo, email, telefono, estado, creado_en | PK, FK RESTRICT; estados Pendiente/Contactado/Inscripto |

Profesionales se limita a identidad porque la reserva solo necesita identificar a la persona; la página Equipo sigue estática. Título, especialidad, descripción, imagen y experiencia pueden incorporarse cuando la página se renderice realmente desde BD; no crear ya un CMS. Tampoco apellido separado si la UI trata al profesional por nombre completo. No se agregan timestamps a catálogos sin consumo actual, ni actualizado_en genérico a todo.

Servicios usa dos importes para soportar el rango ya visible del alisado: precio_desde es el valor único/base y precio_hasta NULL significa precio fijo. No añadir precio además de esos dos. La reserva guarda el importe base estimado al solicitar, sin afirmar que sea un cobro final. imagen almacena ruta, no binario. Categoria es etiqueta de presentación, no requiere tabla adicional ahora. destacado/detalles no se incluyen por no ser necesarios para el consumo actual del asistente.

No se fuerza una cuenta a quien reserva: datos de contacto son una instantánea por solicitud. No hay deduplicación por email que implique identidad verificada; las repeticiones entre solicitudes no son una dependencia transitiva de una entidad cliente que el sistema no administra. Si aparece una ficha de cliente real, esa sería una nueva necesidad.

Cursos e inscripciones se incluyen porque hay formulario activo. Se mantiene contenido comercial estático, incluido importe mensual: si se lo migra después, será DECIMAL, no inversionTexto. No añadir fecha DATE a partir de “10 de julio”, porque no hay año fiable. No imponer UNIQUE(curso_id,email) sin una regla de reinscripción/cohorte definida.

### Tablas opcionales y exclusiones

`trabajos`: opcional solo si se necesita edición de galería. Campos suficientes: id PK, titulo, descripcion, imagen y categoria NOT NULL. Sin profesional_id/servicio_id: la UI no atribuye cada trabajo a personas/servicios de catálogo. No hacen falta fecha, activo ni timestamps sin un uso definido. Sin índice categoria con ocho tarjetas filtradas en navegador. No se incluye en el SQL principal para evitar crear una tabla que nadie consume.

`consultas`: no recomendada; derivar mensaje a WhatsApp/email y no anunciar envío antes de que exista. `clientes`: innecesaria sin ficha ni autenticación del cliente. `negocio` y horarios por profesional: configuración estática por ahora. Certificados, puntos, promociones, tokens de recuperación y verificación: no hay funcionalidad actual que los requiera. No hay tablas existentes justificadas para borrar.

### Relaciones e integridad propuestas

```text
roles          1 ── N usuarios
administradores       (independiente)
profesionales  1 ── N reservas N ── 1 servicios
cursos         1 ── N inscripciones
galería/negocio        (contenido estático, fuera del modelo SQL)
```

Cada reserva exige exactamente un profesional y un servicio; cada inscripción un curso. RESTRICT en todos estos catálogos conserva el historial y obliga a resolver referencias antes de borrar. Desactivar servicios evita ofrecerlos sin borrar reservas anteriores. No se propone CASCADE: borrar un catálogo no debe borrar solicitudes. SET NULL tampoco: perdería identidad requerida en las reservas. No hay trabajos asociados que resolver porque esa relación no existe.

Índices: UK actuales y FK explícitas; reservas(profesional_id,fecha,hora) sirve a agenda por persona y FK; servicio_id e inscripciones.curso_id sostienen integridad. No duplicar índice profesional_id solo ni agregar fecha, estado, email de clientes o activo sin consultas que lo necesiten. La matriz de consultas existentes no afirma que estas consultas futuras estén implementadas.

El índice NO evita solapamientos. Al implementar reserva: iniciar transacción, bloquear la fila del profesional (SELECT ... FOR UPDATE) para serializar sus reservas, consultar intervalos no cancelados del día, rechazar intersección, validar apertura/duración/precio desde servidor, insertar y confirmar. Todos los escritores deben seguir ese protocolo. Un UNIQUE por hora de inicio sería insuficiente para duraciones diferentes y complicaría reutilizar cancelaciones.

## 10. Cambios recomendados, todavía sin implementar

1. Corregir XSS, falsos éxitos, identidad Marian y manejo global de errores sin alterar el modelo existente.
2. Conservar PHP/PDO: extraer UsuariosRepository (SQL), UsuariosService (validación) y AuthService; controladores sencillos y vistas. No añadir framework, interfaces genéricas ni capas vacías.
3. Conectar solo los flujos usados: catálogo de servicios, disponibilidad, alta de reserva e inscripción. No exponer listados de contactos al público ni copiar todos los CRUD de api.js por inercia.
4. Usar un adaptador JS real único; mapear snake_case SQL a camelCase UI explícitamente. `turnos` → `reservas`, `creadoEn` → `creado_en`, `duracionMinutos` → `duracion_minutos`, `precio` → base/estimado. Conservar convención creado_en del ABM por compatibilidad.
5. Migrar en una base nueva y respaldada: mapear srv-*/prof-*/cur-* a IDs enteros, no usar parseInt directo. Revisar datos locales manualmente y no importar fixtures ficticios como clientes reales. Unificar prof-1 y verificar consistencia de precios; cambiar también enlaces ?servicio=srv-1 al nuevo contrato.
6. Verificar COUNT/SHOW CREATE TABLE/FK/índices en MySQL accesible; ejecutar pruebas aisladas y comparar resultados antes de cambiar configuración de la aplicación. No sustituir la base con este SQL como si fuera una migración incremental.
7. Solo entonces retirar fachadas, seeds duplicados y documentación obsoleta, conservando los datos o respaldos necesarios.

## 11. Validación realizada y pendiente

- `node --test tests/calendar.test.cjs`: 6/6 aprobadas.
- `php -l` sobre los 9 PHP actuales: sin errores de sintaxis.
- Conexión PDO de lectura: falla 2002; no se inició ni alteró el servicio MySQL.
- Pruebas ABM/auth y ejecución del SQL propuesto: pendientes por falta de conexión. No se informa que pasaron.
- El esquema propuesto fue revisado estáticamente; no es una migración aplicada ni una solución completa de disponibilidad concurrente.
- Cambios preexistentes del usuario se conservaron. Solo se añadieron documentos y propuesta SQL.

Referencias técnicas: MySQL exige índices para FK y documenta RESTRICT en [FOREIGN KEY Constraints](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html). La propuesta requiere MySQL 8.0.16+ para CHECK efectivos, según [CHECK Constraints](https://docs.oracle.com/cd/E17952_01/mysql-8.0-en/create-table-check-constraints.html). No se validó equivalencia con una versión concreta de MariaDB instalada.
