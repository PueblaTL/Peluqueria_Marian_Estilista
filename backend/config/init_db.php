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
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
    } catch (PDOException $eDirect) {
        // 2. Si falló la conexión directa, intentar crear la base de datos (entornos locales como XAMPP/Laragon)
        $dsnNoDb = sprintf('mysql:host=%s;port=%s;charset=%s', DB_HOST, DB_PORT, DB_CHARSET);
        $pdoRoot = new PDO($dsnNoDb, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        $pdoRoot->exec("CREATE DATABASE IF NOT EXISTS `$dbName` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

        $pdo = new PDO($dsnWithDb, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
    }

    // 4. Cargar y ejecutar schema.sql
    $schemaPath = __DIR__ . '/../sql/schema.sql';
    if (!file_exists($schemaPath)) {
        throw new Exception("No se encontró el archivo $schemaPath");
    }
    $schemaSql = file_get_contents($schemaPath);
    $pdo->exec($schemaSql);

    // 5. Cargar y ejecutar seed.sql
    $seedPath = __DIR__ . '/../sql/seed.sql';
    if (!file_exists($seedPath)) {
        throw new Exception("No se encontró el archivo $seedPath");
    }
    $seedSql = file_get_contents($seedPath);
    $pdo->exec($seedSql);

    echo "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 25px; border-radius: 12px; background: #0c0d12; color: #fff; border: 1px solid #c5a880;'>";
    echo "<h2 style='color: #c5a880; margin-top: 0;'>✨ ¡Base de Datos Inicializada con Éxito!</h2>";
    echo "<p>Se ha creado y poblado la base de datos <strong>`$dbName`</strong> correctamente con todas las tablas e índices.</p>";
    echo "<h3 style='color: #e5d3b3;'>Usuarios de Prueba Creados:</h3>";
    echo "<ul style='line-height: 1.8;'>";
    echo "<li><strong>ADMIN:</strong> admin@marianestilista.com | Clave: <code>Admin123!</code></li>";
    echo "<li><strong>CLIENTE 1:</strong> camila@gmail.com | Clave: <code>Cliente123!</code></li>";
    echo "<li><strong>CLIENTE 2:</strong> luciana@gmail.com | Clave: <code>Cliente123!</code></li>";
    echo "</ul>";
    echo "<p><a href='../../frontend/index.html' style='display: inline-block; background: #c5a880; color: #000; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;'>Ir al Frontend</a></p>";
    echo "</div>";

} catch (Exception $e) {
    http_response_code(500);
    echo "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 25px; border-radius: 12px; background: #2a1212; color: #ff9999; border: 1px solid #ff4444;'>";
    echo "<h2 style='color: #ff6666; margin-top: 0;'>⚠️ Error al Inicializar la Base de Datos</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Verifique que el servicio de MySQL esté iniciado en XAMPP / Laragon y que el usuario/contraseña en <code>backend/config/config.php</code> sean correctos.</p>";
    echo "</div>";
}
