# AURA STUDIO

Entrega académica del **AMBC de usuarios**: alta, modificación, baja, listado y búsqueda. Roles es un catálogo de consulta; una cuenta administradora independiente protege el panel. La landing, reservas y cursos no forman parte de este paquete.

## Requisitos

- Apache 2.4 con PHP habilitado y `AllowOverride All` para esta carpeta (XAMPP estándar).
- PHP 8.1 o superior con PDO, pdo_mysql, mbstring y sesiones.
- MySQL 8.0.16+ o MariaDB 10.4+. Verificado con PHP 8.2.12 y MariaDB 10.4.32.
- Permiso de escritura de PHP en `abm/var` para crear sesiones.

## Instalación

1. Descomprimir `aura_studio.zip` y copiar la carpeta `aura-studio` dentro de `htdocs` de XAMPP o equivalente.
2. Iniciar Apache y MySQL.
3. En phpMyAdmin, abrir **Importar desde la pantalla principal**, seleccionar el archivo externo `base_de_datos.sql` y ejecutar. No es necesario crear la base previamente. Alternativa: `mysql -u root -p < base_de_datos.sql`.
4. Verificar `abm/config/database.example.php`: servidor `127.0.0.1` (local), puerto `3306`, base `aura_studio`, usuario `root`, contraseña vacía. Si la instalación usa otros valores, copiá el archivo como `abm/config/database.php` y ajustalos. No se requiere Composer ni Node.js.
5. Abrir **http://localhost/aura-studio/**. En el primer acceso desde localhost, crear la cuenta administradora con email propio y contraseña de 12 a 72 bytes. Luego se inicia sesión con esos datos; no hay contraseña predefinida.
6. En Usuarios, crear un registro, buscarlo, editarlo y eliminarlo desde su pantalla de confirmación. Roles muestra el catálogo inicial.

**El SQL elimina y recrea `aura_studio`. Una segunda importación borra los usuarios y el administrador: hacer respaldo si se necesitan conservar.**

El panel funciona sin Internet. Los archivos `.htaccess` deben conservarse: bloquean el acceso web a configuración, código interno y sesiones. Si el servidor no permite `.htaccess`, el administrador de Apache debe configurar esas restricciones antes de usarlo. No abrir los PHP con doble clic ni mediante un servidor exclusivamente estático.

Si aparece un error de conexión, revisar que MySQL esté iniciado y que coincidan puerto y credenciales. Los roles asignados a usuarios son descriptivos: no son cuentas de acceso. Para una demostración local se admite root sin contraseña; no publicar esa configuración en Internet.
