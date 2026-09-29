<?php
declare(strict_types=1);

// Iniciar buffer de salida para evitar que cualquier salida previa contamine el JSON
ob_start();

// Manejador de errores PHP: registra advertencias y notices en error_log
// sin imprimirlos directamente al cliente para no romper la respuesta JSON
set_error_handler(function (int $errno, string $errstr, string $errfile, int $errline): bool {
    error_log("[PHP Error $errno] $errstr en $errfile:$errline");
    return true;
});

/**
 * Función auxiliar para responder JSON de forma limpia y consistente.
 */
function responderJson(array $data, int $status = 200): never
{
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Manejar preflight OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (ob_get_length()) {
        ob_clean();
    }
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    http_response_code(204);
    exit;
}

require_once dirname(__DIR__) . '/abm/src/bootstrap.php';

try {
    $db = database();
} catch (Throwable $e) {
    error_log('Error de conexión a base de datos en api/reservas.php: ' . $e->getMessage());
    responderJson([
        'success' => false,
        'message' => 'No se pudo conectar a la base de datos MySQL. Verificá que el servicio esté iniciado.',
        'error'   => 'Error de conexión a la base de datos.'
    ], 503);
}

$action = is_string($_GET['action'] ?? null) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        switch ($action) {
            case 'servicios':
                $repo = new Servicios($db);
                $servicios = $repo->listar(true);
                $resultado = array_map(function ($s) {
                    return [
                        'id'              => (int) $s['id'],
                        'clave'           => $s['clave'] ?? ('legacy-srv-' . $s['id']),
                        'nombre'          => $s['nombre'],
                        'categoria'       => $s['categoria'],
                        'descripcion'     => $s['descripcion'],
                        'precio'          => (float) $s['precio_desde'],
                        'precioDesde'     => (float) $s['precio_desde'],
                        'precioHasta'     => $s['precio_hasta'] !== null ? (float) $s['precio_hasta'] : null,
                        'precioTexto'     => $s['precio_hasta'] !== null
                            ? '$' . number_format((float)$s['precio_desde'], 0, ',', '.') . ' a $' . number_format((float)$s['precio_hasta'], 0, ',', '.')
                            : '$' . number_format((float)$s['precio_desde'], 0, ',', '.'),
                        'duracionMinutos' => (int) $s['duracion_minutos'],
                        'imagen'          => $s['imagen'],
                        'activo'          => (bool) $s['activo'],
                    ];
                }, $servicios);

                responderJson(['success' => true, 'data' => $resultado]);
                break;

            case 'profesionales':
                $repo = new Profesionales($db);
                $profesionales = $repo->listar(true);
                $resultado = array_map(function ($p) {
                    return [
                        'id'           => (int) $p['id'],
                        'clave'        => $p['clave'] ?? ('legacy-prof-' . $p['id']),
                        'nombre'       => $p['nombre'],
                        'titulo'       => $p['titulo'],
                        'especialidad' => $p['especialidad'],
                        'descripcion'  => $p['descripcion'],
                        'imagen'       => $p['imagen'],
                        'activo'       => (bool) $p['activo'],
                    ];
                }, $profesionales);

                responderJson(['success' => true, 'data' => $resultado]);
                break;

            case 'disponibilidad':
                $fecha         = (string) ($_GET['fecha'] ?? '');
                $duracion      = (int) ($_GET['duracion'] ?? $_GET['duracionMinutos'] ?? 60);
                $profesionalId = (int) ($_GET['profesional_id'] ?? $_GET['profesionalId'] ?? 1);

                $repo  = new Reservas($db);
                $slots = $repo->obtenerDisponibilidad($fecha, $duracion, $profesionalId);

                responderJson(['success' => true, 'data' => $slots]);
                break;

            case 'negocio':
                responderJson([
                    'success' => true,
                    'data' => [
                        'nombre'                 => 'Aura Studio',
                        'subtitulo'              => 'Peluquería & Estilismo Integral',
                        'lugar'                  => 'Av. San Martín 450, Centro Comercial Galerías',
                        'direccion'              => 'Av. San Martín 450, Galería Comercial, Piso 1, Local 14',
                        'telefono'               => '+54 11 4567-8900',
                        'whatsapp'               => '+54 11 4567-8900',
                        'horariosTexto'          => 'Martes a Sábados de 09:00 a 19:00 hs',
                        'diasApertura'           => [2, 3, 4, 5, 6],
                        'horaApertura'           => '09:00',
                        'horaCierre'             => '19:00',
                        'intervaloTurnosMinutos' => 30
                    ]
                ]);
                break;

            default:
                responderJson([
                    'success' => false,
                    'message' => 'Acción no válida o no especificada.'
                ], 400);
                break;
        }
    } elseif ($method === 'POST') {
        $raw     = file_get_contents('php://input');
        $payload = $raw !== '' && str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') ? json_decode($raw, true) : $_POST;
        if (!is_array($payload) || array_is_list($payload) || array_filter($payload, fn($value) => is_array($value) || is_object($value))) responderJson(['success'=>false,'message'=>'Formato de solicitud inválido.'],400);

        $repo = new Reservas($db);
        $res  = $repo->crear($payload);

        if (!$res['success']) {
            $msg = !empty($res['errors']) ? implode(' ', $res['errors']) : 'No se pudo registrar la reserva.';
            responderJson([
                'success' => false,
                'message' => $msg,
                'errors'  => $res['errors'] ?? []
            ], 400);
        } else {
            responderJson([
                'success' => true,
                'id'      => $res['id'],
                'codigo'  => $res['codigo'],
                'reserva' => $res['reserva'],
                'message' => 'Turno reservado exitosamente.'
            ], 201);
        }
    } else {
        header('Allow: GET, POST');
        responderJson([
            'success' => false,
            'message' => 'Método HTTP no permitido.'
        ], 405);
    }
} catch (Throwable $e) {
    error_log('Error en api/reservas.php: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    responderJson([
        'success' => false,
        'message' => 'No se pudo procesar la solicitud.',
        'error'   => 'Error interno del servidor.'
    ], 500);
}
