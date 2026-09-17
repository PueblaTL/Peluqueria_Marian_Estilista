<?php
/**
 * init_db.php - Script de Inicialización Automática de Base de Datos y Datos Semilla
 * Puede ejecutarse desde el navegador (http://localhost/marian-estilista/backend/config/init_db.php)
 * o desde la consola (php init_db.php).
 */

require_once __DIR__ . '/config.php';

header('Content-Type: text/html; charset=utf-8');

try {
    $dbName = DB_NAME;
    $pdo = null;

    // 1. Intentar conectar directamente a la base de datos (ideal para hosting donde la base de datos ya fue creada en el panel)
    try {
        $dsnWithDb = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', DB_HOST, DB_PORT, $dbName, DB_CHARSET);
        $pdo = new PDO($dsnWithDb, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => true
        ]);
    } catch (PDOException $eDirect) {
        // 2. Si falló la conexión directa, intentar crear la base de datos (entornos locales como XAMPP/Laragon)
        $dsnNoDb = sprintf('mysql:host=%s;port=%s;charset=%s', DB_HOST, DB_PORT, DB_CHARSET);
        $pdoRoot = new PDO($dsnNoDb, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        $pdoRoot->exec("CREATE DATABASE IF NOT EXISTS `$dbName` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

        $pdo = new PDO($dsnWithDb, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => true
        ]);
    }

    /**
     * Sanitiza y prepara el SQL para ejecución robusta en PDO:
     * - Remueve caracteres BOM UTF-8 (\xEF\xBB\xBF) al inicio del archivo
     * - Adapta sentencias USE / CREATE DATABASE al nombre real configurado ($dbName)
     */
    $prepareSql = function(string $filePath) use ($dbName): string {
        if (!file_exists($filePath)) {
            throw new Exception("No se encontró el archivo: $filePath");
        }
        $sql = file_get_contents($filePath);
        if ($sql === false) {
            throw new Exception("No se pudo leer el archivo: $filePath");
        }
        // 1. Eliminar BOM UTF-8 (\xEF\xBB\xBF) si existe
        if (str_starts_with($sql, "\xEF\xBB\xBF")) {
            $sql = substr($sql, 3);
        }
        // 2. Adaptar nombre de base de datos a la configuración activa (local o hosting)
        $sql = preg_replace('/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+`?[a-zA-Z0-9_]+`?/i', "CREATE DATABASE IF NOT EXISTS `$dbName`", $sql);
        $sql = preg_replace('/USE\s+`?[a-zA-Z0-9_]+`?\s*;/i', "USE `$dbName`;", $sql);

        return trim($sql);
    };

    // 4. Cargar y ejecutar schema.sql
    $schemaPath = __DIR__ . '/../sql/schema.sql';
    $schemaSql = $prepareSql($schemaPath);
    $pdo->exec($schemaSql);

    // 5. Cargar y ejecutar seed.sql
    $seedPath = __DIR__ . '/../sql/seed.sql';
    $seedSql = $prepareSql($seedPath);
    $pdo->exec($seedSql);

    echo "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 25px; border-radius: 12px; background: #0c0d12; color: #fff; border: 1px solid #c5a880;'>";
    echo "<h2 style='color: #c5a880; margin-top: 0;'>✨ ¡Base de Datos Inicializada con Éxito!</h2>";
    echo "<p>Se ha configurado la base de datos <strong>`$dbName`</strong> correctamente con todas las tablas e índices de producción.</p>";
    echo "<p><a href='../../frontend/pages/login.html' style='display: inline-block; background: #c5a880; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;'>Ir al Login</a></p>";
    echo "</div>";


} catch (Exception $e) {
    http_response_code(500);
    echo "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 25px; border-radius: 12px; background: #2a1212; color: #ff9999; border: 1px solid #ff4444;'>";
    echo "<h2 style='color: #ff6666; margin-top: 0;'>⚠️ Error al Inicializar la Base de Datos</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Verifique que el servicio de MySQL esté iniciado en XAMPP / Laragon y que el usuario/contraseña en <code>backend/config/config.php</code> sean correctos.</p>";
    echo "</div>";
}
