<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require dirname(__DIR__) . '/src/bootstrap.php';
$name = databaseConfig()['name'];
if (!preg_match('/\A[a-zA-Z0-9_]+\z/', $name)) throw new RuntimeException('Nombre de base inválido.');
$db = database(false);
$db->exec("CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$db->exec("USE `$name`");
$db->exec(file_get_contents(__DIR__ . '/schema.sql'));
echo "Base $name lista.\n";
