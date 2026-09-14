<?php
/**
 * ProfesionalController.php - Controlador de Profesionales
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../services/ProfesionalService.php';

class ProfesionalController {
    private ProfesionalService $profesionalService;

    public function __construct() {
        $this->profesionalService = new ProfesionalService();
    }

    public function list(): void {
        try {
            $profesionales = $this->profesionalService->getAll();
            jsonResponse(true, "Profesionales obtenidos exitosamente.", $profesionales, 200);
        } catch (Exception $e) {
            jsonResponse(false, $e->getMessage(), null, 500, 'PROFESIONALES_ERROR');
        }
    }

    public function get(): void {
        try {
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) {
                // Si no se pasa ID, devolver el profesional por defecto (Mariano)
                $profesional = $this->profesionalService->getDefault();
            } else {
                $profesional = $this->profesionalService->getById($id);
            }
            jsonResponse(true, "Profesional obtenido.", $profesional, 200);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 404;
            jsonResponse(false, $e->getMessage(), null, $code, 'PROFESIONAL_NOT_FOUND');
        }
    }
}
