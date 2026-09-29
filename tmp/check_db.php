<?php
require __DIR__ . '/../abm/src/bootstrap.php';
try {
    $db = database();
    echo "Conectado OK\n";
    $tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    if ($tables) {
        echo "Tablas:\n";
        foreach ($tables as $t) {
            echo "  - $t\n";
        }
    } else {
        echo "Base de datos vacía (sin tablas).\n";
    }
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
