<?php
require_once __DIR__ . '/../../controllers/InscripcionController.php';

// Validar antes de construir el repositorio o abrir una conexión a MySQL.
requireAuth();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Método no permitido.', null, 405);
}

$controller = new InscripcionController();
$controller->create();
