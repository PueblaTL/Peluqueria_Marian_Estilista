<?php
/**
 * ProfesionalService.php - Lógica de Negocio para Profesionales
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../repositories/ProfesionalRepository.php';

class ProfesionalService {
    private ProfesionalRepository $profesionalRepo;

    public function __construct() {
        $this->profesionalRepo = new ProfesionalRepository();
    }

    public function getAll(): array {
        $profesionales = $this->profesionalRepo->getAllActive();
        return array_map(fn($p) => $p->toArray(), $profesionales);
    }

    public function getById(int $id): array {
        $profesional = $this->profesionalRepo->getById($id);
        if (!$profesional) {
            throw new Exception("El profesional con ID $id no fue encontrado.", 404);
        }
        return $profesional->toArray();
    }

    public function getDefault(): array {
        $profesional = $this->profesionalRepo->getDefault();
        if (!$profesional) {
            throw new Exception("No hay profesionales activos configurados.", 404);
        }
        return $profesional->toArray();
    }
}
