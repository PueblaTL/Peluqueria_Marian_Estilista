<?php
require __DIR__ . '/../abm/src/bootstrap.php';

$email    = 'admin@aurastudio.com';
$password = 'AuraStudio2025!';  // Password demo para la presentación
$hash     = password_hash($password, PASSWORD_DEFAULT);

try {
    $db = database();

    // Eliminar si ya existe (para poder re-ejecutar)
    $db->exec('DELETE FROM administradores WHERE id = 1');

    $stmt = $db->prepare('INSERT INTO administradores (id, email, password_hash) VALUES (1, ?, ?)');
    $stmt->execute([$email, $hash]);

    echo "Admin creado exitosamente!\n";
    echo "  Email:    $email\n";
    echo "  Password: $password\n";
    echo "\nPodés iniciar sesion en: abm/public/login.php\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
