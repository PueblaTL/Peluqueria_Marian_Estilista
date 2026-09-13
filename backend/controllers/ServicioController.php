<?php
/**
 * ServicioController.php - Controlador de Servicios
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../services/ServicioService.php';

class ServicioController {
    private ServicioService $servicioService;

    public function __construct() {
        $this->servicioService = new ServicioService();
    }

    public function list(): void {
        try {
            $soloActivos = !isset($_GET['todos']) || $_GET['todos'] !== '1';
            $servicios = $this->servicioService->getAll($soloActivos);
            jsonResponse(true, "Servicios obtenidos exitosamente.", $servicios, 200);
        } catch (Exception $e) {
            jsonResponse(false, $e->getMessage(), null, 500, 'SERVICES_ERROR');
        }
    }

    public function get(): void {
        try {
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) {
                jsonResponse(false, "ID de servicio inválido.", null, 400, 'INVALID_ID');
            }
            $servicio = $this->servicioService->getById($id);
            jsonResponse(true, "Servicio obtenido.", $servicio, 200);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 404;
            jsonResponse(false, $e->getMessage(), null, $code, 'SERVICE_NOT_FOUND');
        }
    }

    public function create(): void {
        requireAdmin();

        try {
            $data = getRequestData();
            $servicio = $this->servicioService->create($data);
            jsonResponse(true, "Servicio creado exitosamente.", $servicio, 201);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'CREATE_SERVICE_ERROR');
        }
    }

    public function update(): void {
        requireAdmin();

        try {
            $data = getRequestData();
            $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
            if ($id <= 0) {
                jsonResponse(false, "ID de servicio inválido.", null, 400, 'INVALID_ID');
            }
            $servicio = $this->servicioService->update($id, $data);
            jsonResponse(true, "Servicio actualizado exitosamente.", $servicio, 200);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'UPDATE_SERVICE_ERROR');
        }
    }

    public function delete(): void {
        requireAdmin();

        try {
            $data = getRequestData();
            $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
            if ($id <= 0) {
                jsonResponse(false, "ID de servicio inválido.", null, 400, 'INVALID_ID');
            }
            $this->servicioService->delete($id);
            jsonResponse(true, "Servicio eliminado exitosamente.", null, 200);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'DELETE_SERVICE_ERROR');
        }
    }
}
