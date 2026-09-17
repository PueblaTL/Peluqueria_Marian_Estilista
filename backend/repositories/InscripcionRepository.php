<?php
/**
 * InscripcionRepository.php - Acceso a Datos para Inscripciones del Curso
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Inscripcion.php';

class InscripcionRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Obtiene todas las inscripciones ordenadas de más reciente a más antigua.
     *
     * @return Inscripcion[]
     */
    public function getAll(): array {
        $sql = "SELECT * FROM `inscripciones_curso` ORDER BY `fecha` DESC, `id` DESC";
        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $inscripciones = [];
        foreach ($rows as $row) {
            $inscripciones[] = new Inscripcion($row);
        }
        return $inscripciones;
    }

    /**
     * Busca una inscripción por su ID primario.
     *
     * @param int $id
     * @return Inscripcion|null
     */
    public function getById(int $id): ?Inscripcion {
        $sql = "SELECT * FROM `inscripciones_curso` WHERE `id` = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? new Inscripcion($row) : null;
    }

    /**
     * Busca una inscripción por email y curso para prevenir duplicados.
     *
     * @param string $email
     * @param string $cursoId
     * @return Inscripcion|null
     */
    public function findByEmailAndCurso(string $email, string $cursoId = 'cur-1'): ?Inscripcion {
        $sql = "SELECT * FROM `inscripciones_curso` WHERE `email` = :email AND `curso_id` = :curso_id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':email'    => strtolower(trim($email)),
            ':curso_id' => trim($cursoId)
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ? new Inscripcion($row) : null;
    }

    /**
     * Inserta una nueva inscripción en la base de datos.
     *
     * @param Inscripcion $inscripcion
     * @return int ID generado
     */
    public function create(Inscripcion $inscripcion): int {
        $sql = "INSERT INTO `inscripciones_curso` (
            `curso_id`, `nombre`, `apellido`, `telefono`, `email`, `estado`, `fecha`
        ) VALUES (
            :curso_id, :nombre, :apellido, :telefono, :email, :estado, :fecha
        )";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':curso_id' => $inscripcion->cursoId,
            ':nombre'   => $inscripcion->nombre,
            ':apellido' => $inscripcion->apellido,
            ':telefono' => $inscripcion->telefono,
            ':email'    => $inscripcion->email,
            ':estado'   => $inscripcion->estado,
            ':fecha'    => $inscripcion->fecha
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Actualiza el estado de una inscripción existente.
     *
     * @param int $id
     * @param string $nuevoEstado
     * @return bool
     */
    public function updateEstado(int $id, string $nuevoEstado): bool {
        $sql = "UPDATE `inscripciones_curso` SET `estado` = :estado WHERE `id` = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':estado' => $nuevoEstado,
            ':id'     => $id
        ]);
    }

    /**
     * Elimina físicamente una inscripción de la base de datos.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool {
        $sql = "DELETE FROM `inscripciones_curso` WHERE `id` = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }

    /**
     * Obtiene la cantidad total de inscripciones.
     *
     * @return int
     */
    public function count(): int {
        return (int)$this->db->query("SELECT COUNT(*) FROM `inscripciones_curso`")->fetchColumn();
    }
}
