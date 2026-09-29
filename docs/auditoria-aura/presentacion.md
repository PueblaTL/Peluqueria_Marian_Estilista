# Guion para la exposición de Aura Studio

## Versión actual: qué podemos afirmar hoy

**1. ¿Qué almacena nuestra base de datos?**
El esquema MySQL del panel almacena registros de usuarios, sus roles y una cuenta administradora. El sitio público todavía guarda turnos e inscripciones en el navegador. Esos datos no llegan a MySQL ni al salón. El formulario de contacto actualmente simula un envío: es una limitación detectada en la auditoría.

**2. ¿Por qué elegimos una base relacional?**
Porque organiza los datos en tablas y permite relacionarlos con reglas que evitan referencias inexistentes. Por ejemplo, no se puede asignar a un usuario un rol que no exista. Además podemos consultar y actualizar registros desde distintos clientes con un origen central, cuando los flujos estén conectados al servidor.

**3. ¿Qué representa cada tabla actual?**
Usuarios contiene los registros del ejercicio ABM: nombre, apellido, nickname, email y rol. Roles contiene las descripciones que pueden asignarse. Administradores contiene la cuenta que inicia sesión para gestionar el panel. Los usuarios del ABM no son cuentas que puedan iniciar sesión.

**4. ¿Qué relaciones existen?**
Un rol puede estar asignado a muchos usuarios; cada usuario tiene un rol. La cuenta administradora es independiente. No debemos afirmar que existen relaciones SQL con turnos, porque hoy los turnos están en localStorage.

**5. ¿Qué es una clave primaria?**
Es el identificador único de cada fila. El id permite distinguir dos usuarios incluso si tienen el mismo nombre.

**6. ¿Qué es una clave foránea?**
Es un campo que referencia la clave de otra tabla. usuarios.rol_id apunta a roles.id. La base impide guardar un rol inexistente y rechaza eliminar uno que todavía tenga usuarios.

**7. ¿Cómo evitamos duplicación?**
Guardamos cada rol una sola vez y lo referenciamos por id. Los emails y nicknames de usuarios tienen restricciones UNIQUE. Hay duplicaciones pendientes en el portal, como servicios en HTML y en los datos JavaScript; la auditoría propone unificarlas. No sería correcto decir que todo el proyecto ya tiene una fuente única.

**8. ¿Cómo se comunica el backend con MySQL?**
PHP abre una conexión usando PDO y el controlador de MySQL. Envía consultas y transforma los resultados en páginas HTML. La configuración permite elegir servidor, puerto, base y credenciales. Las páginas públicas todavía no llaman a ese backend para reservar.

**9. ¿Qué arquitectura utiliza el backend?**
Es una aplicación PHP pequeña con páginas que reciben peticiones y renderizan HTML. La clase Usuarios concentra consultas y validación; login también contiene SQL. No implementa todavía una separación completa Controller–Service–Repository. Proponemos separar consultas y reglas de negocio sin añadir un framework innecesario.

**10. ¿Cómo protegemos las consultas frente a SQL Injection?**
Usamos consultas preparadas: la estructura SQL se escribe por separado de los valores ingresados. PDO envía esos valores como datos. Además validamos formatos y longitudes. Para mostrar texto en HTML usamos escape en el panel; la auditoría detectó que el asistente público necesita esa misma atención. Las contraseñas de administrador se guardan como hash, nunca en texto plano.

## Propuesta de evolución, todavía no implementada

“Proponemos persistir las funciones que la interfaz ya ofrece. Servicios guardará el catálogo y sus precios decimales; profesionales identificará quién atiende; reservas guardará servicio, profesional, fecha, hora y contacto de la persona. Cursos identificará el curso e inscripciones guardará cada solicitud. Conservamos el ABM actual. La galería y los datos institucionales pueden seguir siendo estáticos.”

```text
ACTUAL
roles 1 ─── N usuarios       administradores (independiente)

PROPUESTO, ADICIONAL
profesionales 1 ─── N reservas N ─── 1 servicios
cursos        1 ─── N inscripciones
```

“No borramos reservas cuando se elimina un servicio o profesional: la base rechazará eliminar un registro que tenga reservas. Los precios se modelan con DECIMAL, y el importe estimado de una reserva se conserva aunque el catálogo cambie después. Las reservas simultáneas requieren una transacción y verificar que los horarios no se superpongan; una clave foránea por sí sola no resuelve ese problema.”

“No añadimos certificados ni puntos porque no hay funciones actuales que los necesiten. Sí conservamos cursos y reservas porque sus formularios existen y se usan. No agregamos tablas solo por aparecer en una lista de posibles funcionalidades.”

## Qué se verificó

Las seis pruebas del calendario pasaron y los nueve archivos PHP no presentan errores de sintaxis. La conexión MySQL falló con código 2002: falta validar el esquema instalado y ejecutar las pruebas de integración. El SQL entregado es una propuesta para una base nueva, no una migración aplicada. No se cambió la aplicación ni se borraron datos durante la auditoría.
