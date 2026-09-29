<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once dirname(__DIR__) . '/abm/src/bootstrap.php';

try {
    $db = database();
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'error' => 'No se pudo conectar a la base de datos MySQL. Verificá que el servicio esté iniciado.',
        'details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$action = is_string($_GET['action'] ?? null) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        switch ($action) {
            case 'servicios':
                $repo = new Servicios($db);
                $servicios = $repo->listar(true);
                // Mapear campos para compatibilidad con frontend
                $resultado = array_map(function ($s) {
                    return [
                        'id' => (int) $s['id'],
                        'clave' => 'srv-' . $s['id'],
                        'nombre' => $s['nombre'],
                        'categoria' => $s['categoria'],
                        'descripcion' => $s['descripcion'],
                        'precio' => (float) $s['precio_desde'],
                        'precioDesde' => (float) $s['precio_desde'],
                        'precioHasta' => $s['precio_hasta'] !== null ? (float) $s['precio_hasta'] : null,
                        'precioTexto' => $s['precio_hasta'] !== null 
                            ? '$' . number_format((float)$s['precio_desde'], 0, ',', '.') . ' a $' . number_format((float)$s['precio_hasta'], 0, ',', '.')
                            : '$' . number_format((float)$s['precio_desde'], 0, ',', '.'),
                        'duracionMinutos' => (int) $s['duracion_minutos'],
                        'imagen' => $s['imagen'],
                        'activo' => (bool) $s['activo'],
                    ];
                }, $servicios);
                echo json_encode(['success' => true, 'data' => $resultado], JSON_UNESCAPED_UNICODE);
                break;

            case 'profesionales':
                $repo = new Profesionales($db);
                $profesionales = $repo->listar(true);
                $resultado = array_map(function ($p) {
                    return [
                        'id' => (int) $p['id'],
                        'clave' => 'prof-' . $p['id'],
                        'nombre' => $p['nombre'],
                        'titulo' => $p['titulo'],
                        'especialidad' => $p['especialidad'],
                        'descripcion' => $p['descripcion'],
                        'imagen' => $p['imagen'],
                        'activo' => (bool) $p['activo'],
                    ];
                }, $profesionales);
                echo json_encode(['success' => true, 'data' => $resultado], JSON_UNESCAPED_UNICODE);
                break;

            case 'disponibilidad':
                $fecha = (string) ($_GET['fecha'] ?? '');
                $duracion = (int) ($_GET['duracion'] ?? $_GET['duracionMinutos'] ?? 60);
                $profesionalId = (int) ($_GET['profesional_id'] ?? $_GET['profesionalId'] ?? 1);

                $repo = new Reservas($db);
                $slots = $repo->obtenerDisponibilidad($fecha, $duracion, $profesionalId);
                echo json_encode(['success' => true, 'data' => $slots], JSON_UNESCAPED_UNICODE);
                break;

            case 'negocio':
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'nombre' => 'Aura Studio',
                        'subtitulo' => 'Peluquería & Estilismo Integral',
                        'lugar' => 'Av. San Martín 450, Centro Comercial Galerías',
                        'direccion' => 'Av. San Martín 450, Galería Comercial, Piso 1, Local 14',
                        'telefono' => '+54 11 4567-8900',
                        'whatsapp' => '+54 11 4567-8900',
                        'horariosTexto' => 'Martes a Sábados de 09:00 a 19:00 hs',
                        'diasApertura' => [2, 3, 4, 5, 6],
                        'horaApertura' => '09:00',
                        'horaCierre' => '19:00',
                        'intervaloTurnosMinutos' => 30
                    ]
                ], JSON_UNESCAPED_UNICODE);
                break;

            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Acción no válida o no especificada.'], JSON_UNESCAPED_UNICODE);
                break;
        }
    } elseif ($method === 'POST') {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true) ?: $_POST;

        $repo = new Reservas($db);
        $res = $repo->crear($payload);

        if (!$res['success']) {
            http_response_code(422);
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(201);
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
        }
    } else {
        http_response_code(405);
        header('Allow: GET, POST');
        echo json_encode(['success' => false, 'error' => 'Método HTTP no permitido.'], JSON_UNESCAPED_UNICODE);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno al procesar la reserva.',
        'details' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
