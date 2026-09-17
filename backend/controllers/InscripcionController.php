<?php
/**
 * InscripcionController.php - Controlador de Inscripciones al Curso Profesional
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../services/InscripcionService.php';

class InscripcionController {
    private InscripcionService $service;

    public function __construct() {
        $this->service = new InscripcionService();
    }

    /**
     * Lista todas las inscripciones registradas.
     * Requiere permisos de Administrador.
     * Endpoint: GET /backend/api/inscripciones/list.php
     */
    public function list(): void {
        requireAdmin();

        try {
            $inscripciones = $this->service->getAll();
            jsonResponse(true, "Inscripciones obtenidas exitosamente.", $inscripciones, 200);
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
            jsonResponse(false, $e->getMessage(), null, $code, 'INSCRIPCIONES_FETCH_ERROR');
        }
    }

    /**
     * Registra una nueva inscripción al curso (público desde landing o manual desde admin).
     * Endpoint: POST /backend/api/inscripciones/create.php
     */
    public function create(): void {
        try {
            $data = getRequestData();
            
            // Si no está autenticado como ADMIN, forzar estado 'Pendiente' para registros públicos de la landing
            $user = getAuthUser();
            if (!$user || ($user['rol'] ?? '') !== 'ADMIN') {
                $data['estado'] = 'Pendiente';
            }

            $inscripcion = $this->service->create($data);
            jsonResponse(true, "Inscripción registrada con éxito.", $inscripcion, 201);
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'CREATE_INSCRIPCION_ERROR');
        }
    }

    /**
     * Actualiza el estado de una inscripción existente.
     * Requiere permisos de Administrador.
     * Endpoint: POST /backend/api/inscripciones/update_estado.php
     */
    public function updateEstado(): void {
        requireAdmin();

        try {
            $data = getRequestData();
            $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
            $nuevoEstado = trim($data['estado'] ?? '');

            if ($id <= 0) {
                jsonResponse(false, "ID de inscripción no válido.", null, 400, 'INVALID_ID');
            }
            if (empty($nuevoEstado)) {
                jsonResponse(false, "El nuevo estado es obligatorio.", null, 400, 'INVALID_STATE');
            }

            $actualizada = $this->service->updateEstado($id, $nuevoEstado);
            jsonResponse(true, "Estado de inscripción actualizado correctamente.", $actualizada, 200);
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'UPDATE_INSCRIPCION_ERROR');
        }
    }

    /**
     * Elimina físicamente una inscripción de la base de datos.
     * Requiere permisos de Administrador.
     * Endpoint: POST /backend/api/inscripciones/delete.php
     */
    public function delete(): void {
        requireAdmin();

        try {
            $data = getRequestData();
            $id = (int)($data['id'] ?? $_GET['id'] ?? 0);

            if ($id <= 0) {
                jsonResponse(false, "ID de inscripción no válido.", null, 400, 'INVALID_ID');
            }

            $this->service->delete($id);
            jsonResponse(true, "Inscripción eliminada correctamente.", null, 200);
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'DELETE_INSCRIPCION_ERROR');
        }
    }
}
