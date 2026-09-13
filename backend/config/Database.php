<?php
/**
 * Database.php - Gestor de Conexión PDO a MySQL
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $connection = null;

    /**
     * Retorna una instancia única (Singleton) de la conexión PDO.
     *
     * @return PDO
     * @throws Exception Si ocurre un fallo al conectar con la base de datos
     */
    public static function getConnection(): PDO {
        if (self::$connection === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            try {
                self::$connection = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // Registrar internamente en log sin exponer detalles de infraestructura al cliente
                error_log("Error de conexión a la base de datos MySQL: " . $e->getMessage());
                throw new Exception("No se pudo establecer la conexión con la base de datos. Verifique la configuración.");
            }
        }

        return self::$connection;
    }
}
