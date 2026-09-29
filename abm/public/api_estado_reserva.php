<?php
/**
 * api_estado_reserva.php
 * Endpoint AJAX para cambiar el estado de una reserva desde el panel admin.
 * Devuelve siempre JSON. Requiere sesión de administrador activa.
 */
declare(strict_types=1);

ob_start();
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

require dirname(__DIR__) . '/src/auth.php';

function responderJsonEstado(array $data, int $status = 200): never
{
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Verificar sesión de administrador (responde 401 JSON si no está autenticado)
requireLoginApi();

// Solo acepta POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderJsonEstado(['success' => false, 'message' => 'Método no permitido.'], 405);
}

// Leer payload JSON o form-data
$raw     = file_get_contents('php://input');
$payload = $raw !== '' && str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') ? json_decode($raw, true) : $_POST;
if (!is_array($payload) || array_is_list($payload) || array_filter($payload, fn($v)=>is_array($v)||is_object($v))) responderJsonEstado(['success'=>false,'message'=>'Formato inválido.'],400);

// Validar CSRF
$csrf = (string) ($payload['csrf'] ?? '');
if (!is_string($csrf) || !hash_equals($_SESSION['csrf'], $csrf)) {
    responderJsonEstado(['success' => false, 'message' => 'Token de seguridad inválido. Recargá la página.'], 403);
}

$reservaId   = (int) ($payload['reserva_id'] ?? 0);
$nuevoEstado = trim((string) ($payload['nuevo_estado'] ?? ''));

if ($reservaId <= 0) {
    responderJsonEstado(['success' => false, 'message' => 'ID de reserva inválido.'], 400);
}

$estadosValidos = ['Pendiente', 'Confirmado', 'Cancelado', 'Completado'];
if (!in_array($nuevoEstado, $estadosValidos, true)) {
    responderJsonEstado(['success' => false, 'message' => 'Estado inválido.'], 400);
}

try {
    $db      = database();
    $repoRes = new Reservas($db);

    $reservaExistente = $repoRes->buscar($reservaId);
    if (!$reservaExistente) {
        responderJsonEstado(['success' => false, 'message' => 'No se encontró la reserva solicitada.'], 404);
    }

    $ok = $repoRes->cambiarEstado($reservaId, $nuevoEstado);

    if (!$ok) responderJsonEstado(['success'=>false,'message'=>'Transición de estado no permitida.'],409);
    responderJsonEstado([
        'success'      => true,
        'message'      => 'Estado actualizado a "' . $nuevoEstado . '" correctamente.',
        'nuevo_estado' => $nuevoEstado,
        'reserva_id'   => $reservaId,
    ]);
} catch (Throwable $ex) {
    error_log('Error en api_estado_reserva.php: ' . $ex->getMessage());
    responderJsonEstado(['success' => false, 'message' => 'Error interno al actualizar el estado.'], 500);
}
