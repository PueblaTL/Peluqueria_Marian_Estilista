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
                // Si la base de datos no fue encontrada (error 1049), intentar nombres alternativos comunes en hosting cPanel
                if ($e->getCode() == 1049 || strpos($e->getMessage(), '1049') !== false) {
                    $candidatos = ['a0190776_marian', 'a0190776_marian_estilista', 'marian_estilista'];
                    foreach ($candidatos as $cand) {
                        if ($cand !== DB_NAME) {
                            try {
                                $altDsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', DB_HOST, DB_PORT, $cand, DB_CHARSET);
                                self::$connection = new PDO($altDsn, DB_USER, DB_PASS, $options);
                                return self::$connection;
                            } catch (PDOException $e2) {
                                // Continuar con el siguiente candidato
                            }
                        }
                    }
                }

                // Registrar internamente en log
                error_log("Error de conexión a la base de datos MySQL: " . $e->getMessage());
                throw new Exception("Error de conexión a la base de datos MySQL en '" . DB_HOST . "' con usuario '" . DB_USER . "' y BD '" . DB_NAME . "': " . $e->getMessage());
            }
        }

        return self::$connection;
    }
}
