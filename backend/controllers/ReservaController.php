<?php
/**
 * ReservaController.php - Controlador de Reservas / Turnos
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../services/ReservaService.php';

class ReservaController {
    private ReservaService $reservaService;

    public function __construct() {
        $this->reservaService = new ReservaService();
    }

    /**
     * Lista las reservas del usuario autenticado (o todas si es ADMIN).
     */
    public function list(): void {
        $user = requireAuth();

        try {
            $filtros = [
                'fecha'  => $_GET['fecha'] ?? null,
                'estado' => $_GET['estado'] ?? null,
                'search' => $_GET['search'] ?? null
            ];
            $reservas = $this->reservaService->getReservas($user, $filtros);
            jsonResponse(true, "Reservas obtenidas exitosamente.", $reservas, 200, null, 'success');
        } catch (Exception $e) {
            error_log("[ReservaController list] " . $e->getMessage());
            jsonResponse(false, "No se pudieron obtener las reservas.", null, 500, 'RESERVAS_FETCH_ERROR', 'server');
        }
    }

    /**
     * Obtiene una reserva individual.
     */
    public function get(): void {
        $user = requireAuth();

        try {
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) {
                jsonResponse(false, "ID de reserva inválido.", null, 400, 'INVALID_ID', 'validation');
            }
            $reserva = $this->reservaService->getById($id, $user);
            jsonResponse(true, "Reserva obtenida.", $reserva, 200, null, 'success');
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 404;
            jsonResponse(false, $e->getMessage(), null, $code, 'RESERVA_ERROR', 'validation');
        }
    }

    /**
     * Registra una nueva reserva. Requiere autenticación.
     */
    public function create(): void {
        $user = requireAuth();

        try {
            $data = getRequestData();
            $nuevaReserva = $this->reservaService->createReserva($data, $user);
            jsonResponse(true, "Turno reservado correctamente.", $nuevaReserva, 201, null, 'success');
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            $type = 'validation';
            if ($code === 409) {
                $type = 'availability';
            } elseif ($code === 403) {
                $type = 'unverified_email';
            } elseif ($code >= 500) {
                $type = 'server';
            }
            $errType = ($code === 409) ? 'SCHEDULE_UNAVAILABLE' : 'CREATE_RESERVA_ERROR';
            jsonResponse(false, $e->getMessage(), null, $code, $errType, $type);
        }
    }

    /**
     * Actualiza el estado de una reserva (o cancela).
     */
    public function update(): void {
        $user = requireAuth();

        try {
            $data = getRequestData();
            $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
            $nuevoEstado = $data['estado'] ?? '';

            if ($id <= 0 || empty($nuevoEstado)) {
                jsonResponse(false, "ID y nuevo estado son obligatorios.", null, 400, 'INVALID_INPUT', 'validation');
            }

            $actualizada = $this->reservaService->updateEstado($id, $nuevoEstado, $user);
            jsonResponse(true, "Estado de la reserva actualizado a $nuevoEstado.", $actualizada, 200, null, 'success');
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'UPDATE_RESERVA_ERROR', 'validation');
        }
    }

    /**
     * Cancela o elimina una reserva.
     */
    public function delete(): void {
        $user = requireAuth();

        try {
            $data = getRequestData();
            $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
            if ($id <= 0) {
                jsonResponse(false, "ID de reserva inválido.", null, 400, 'INVALID_ID', 'validation');
            }

            // Los clientes cancelan la reserva; el admin puede cancelarla
            $actualizada = $this->reservaService->updateEstado($id, 'CANCELADA', $user);
            jsonResponse(true, "Reserva cancelada correctamente.", $actualizada, 200, null, 'success');
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'DELETE_RESERVA_ERROR', 'validation');
        }
    }

    /**
     * Consulta pública de slots horarios disponibles para una fecha y duración dada.
     */
    public function disponibilidad(): void {
        try {
            $fecha = trim($_GET['fecha'] ?? '');
            $duracion = (int)($_GET['duracion'] ?? $_GET['duracion_minutos'] ?? 60);
            $profesionalId = (int)($_GET['profesional_id'] ?? 1);

            if (empty($fecha)) {
                jsonResponse(false, "El parámetro 'fecha' (AAAA-MM-DD) es obligatorio.", null, 400, 'MISSING_DATE', 'validation');
            }

            $slots = $this->reservaService->getDisponibilidad($profesionalId, $fecha, $duracion);
            jsonResponse(true, "Disponibilidad calculada.", $slots, 200, null, 'success');
        } catch (Exception $e) {
            error_log("[ReservaController disponibilidad] " . $e->getMessage());
            jsonResponse(false, "No pudimos calcular los horarios disponibles. Por favor intentá nuevamente.", null, 500, 'DISPONIBILIDAD_ERROR', 'server');
        }
    }
}
