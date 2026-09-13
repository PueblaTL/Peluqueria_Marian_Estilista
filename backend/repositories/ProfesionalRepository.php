<?php
/**
 * ProfesionalRepository.php - Acceso a Datos para la entidad Profesional
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Profesional.php';

class ProfesionalRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Obtiene todos los profesionales activos.
     *
     * @return Profesional[]
     */
    public function getAllActive(): array {
        $sql = "SELECT * FROM `profesionales` WHERE `activo` = 1 ORDER BY `id` ASC";
        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll();

        $profesionales = [];
        foreach ($rows as $row) {
            $profesionales[] = new Profesional($row);
        }
        return $profesionales;
    }

    /**
     * Busca un profesional por su ID.
     *
     * @param int $id
     * @return Profesional|null
     */
    public function getById(int $id): ?Profesional {
        $sql = "SELECT * FROM `profesionales` WHERE `id` = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        return $row ? new Profesional($row) : null;
    }

    /**
     * Retorna el profesional titular por defecto (Mariano).
     *
     * @return Profesional|null
     */
    public function getDefault(): ?Profesional {
        $sql = "SELECT * FROM `profesionales` WHERE `activo` = 1 ORDER BY `id` ASC LIMIT 1";
        $stmt = $this->db->query($sql);
        $row = $stmt->fetch();

        return $row ? new Profesional($row) : null;
    }
}
