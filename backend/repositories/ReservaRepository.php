<?php
/**
 * ReservaRepository.php - Acceso a Datos para Reservas / Turnos
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Reserva.php';

class ReservaRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Obtiene el listado de reservas de un cliente específico con JOIN a servicios y profesionales.
     *
     * @param int $usuarioId
     * @return Reserva[]
     */
    public function getByUsuario(int $usuarioId): array {
        $sql = "SELECT r.*, 
                       u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email, u.telefono AS usuario_telefono,
                       s.nombre AS servicio_nombre, s.categoria AS servicio_categoria,
                       p.nombre AS profesional_nombre
                FROM `reservas` r
                INNER JOIN `usuarios` u ON r.usuario_id = u.id
                INNER JOIN `servicios` s ON r.servicio_id = s.id
                INNER JOIN `profesionales` p ON r.profesional_id = p.id
                WHERE r.usuario_id = :usuario_id
                ORDER BY r.fecha DESC, r.hora DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':usuario_id' => $usuarioId]);
        $rows = $stmt->fetchAll();

        $reservas = [];
        foreach ($rows as $row) {
            $reservas[] = new Reserva($row);
        }
        return $reservas;
    }

    /**
     * Obtiene todas las reservas registradas (vista de administración) con filtros opcionales.
     *
     * @param array $filtros
     * @return Reserva[]
     */
    public function getAll(array $filtros = []): array {
        $sql = "SELECT r.*, 
                       u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email, u.telefono AS usuario_telefono,
                       s.nombre AS servicio_nombre, s.categoria AS servicio_categoria,
                       p.nombre AS profesional_nombre
                FROM `reservas` r
                INNER JOIN `usuarios` u ON r.usuario_id = u.id
                INNER JOIN `servicios` s ON r.servicio_id = s.id
                INNER JOIN `profesionales` p ON r.profesional_id = p.id
                WHERE 1=1";

        $params = [];

        if (!empty($filtros['fecha'])) {
            $sql .= " AND r.fecha = :fecha";
            $params[':fecha'] = $filtros['fecha'];
        }

        if (!empty($filtros['estado']) && strtolower($filtros['estado']) !== 'todos') {
            $sql .= " AND LOWER(r.estado) = :estado";
            $params[':estado'] = strtolower($filtros['estado']);
        }

        if (!empty($filtros['search'])) {
            $sql .= " AND (u.nombre LIKE :s_nom OR u.apellido LIKE :s_ape OR u.email LIKE :s_mail OR u.telefono LIKE :s_tel OR s.nombre LIKE :s_srv)";
            $searchTerm = '%' . $filtros['search'] . '%';
            $params[':s_nom']  = $searchTerm;
            $params[':s_ape']  = $searchTerm;
            $params[':s_mail'] = $searchTerm;
            $params[':s_tel']  = $searchTerm;
            $params[':s_srv']  = $searchTerm;
        }

        $sql .= " ORDER BY r.fecha DESC, r.hora DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $reservas = [];
        foreach ($rows as $row) {
            $reservas[] = new Reserva($row);
        }
        return $reservas;
    }

    /**
     * Busca una reserva por su ID.
     *
     * @param int $id
     * @return Reserva|null
     */
    public function getById(int $id): ?Reserva {
        $sql = "SELECT r.*, 
                       u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email, u.telefono AS usuario_telefono,
                       s.nombre AS servicio_nombre, s.categoria AS servicio_categoria,
                       p.nombre AS profesional_nombre
                FROM `reservas` r
                INNER JOIN `usuarios` u ON r.usuario_id = u.id
                INNER JOIN `servicios` s ON r.servicio_id = s.id
                INNER JOIN `profesionales` p ON r.profesional_id = p.id
                WHERE r.id = :id LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        return $row ? new Reserva($row) : null;
    }

    /**
     * Registra una nueva reserva en la base de datos.
     *
     * @param Reserva $reserva
     * @return int ID de la reserva creada
     */
    public function create(Reserva $reserva): int {
        $sql = "INSERT INTO `reservas` 
                (`usuario_id`, `profesional_id`, `servicio_id`, `fecha`, `hora`, `duracion_minutos`, `precio`, `estado`, `observaciones`, `created_at`)
                VALUES 
                (:usuario_id, :profesional_id, :servicio_id, :fecha, :hora, :duracion_minutos, :precio, :estado, :observaciones, NOW())";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':usuario_id'       => $reserva->usuarioId,
            ':profesional_id'   => $reserva->profesionalId,
            ':servicio_id'      => $reserva->servicioId,
            ':fecha'            => $reserva->fecha,
            ':hora'             => $reserva->hora,
            ':duracion_minutos' => $reserva->duracionMinutos,
            ':precio'           => $reserva->precio,
            ':estado'           => $reserva->estado,
            ':observaciones'    => $reserva->observaciones
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Actualiza el estado de una reserva (PENDIENTE, CONFIRMADA, CANCELADA, COMPLETADA).
     *
     * @param int $id
     * @param string $nuevoEstado
     * @return bool
     */
    public function updateEstado(int $id, string $nuevoEstado): bool {
        $sql = "UPDATE `reservas` SET `estado` = :estado, `updated_at` = NOW() WHERE `id` = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':id'     => $id,
            ':estado' => strtoupper(trim($nuevoEstado))
        ]);
    }

    /**
     * Elimina físicamente una reserva (usualmente para administradores).
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool {
        $sql = "DELETE FROM `reservas` WHERE `id` = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }

    /**
     * Busca reservas activas que colisionen en fecha y rango horario para un profesional.
     * Comprueba: slotInicio < turnoFin Y slotFin > turnoInicio.
     *
     * @param int $profesionalId
     * @param string $fecha (YYYY-MM-DD)
     * @param string $hora (HH:MM o HH:MM:SS)
     * @param int $duracionMinutos
     * @param int|null $ignoreReservaId ID de reserva a ignorar (útil al reprogramar)
     * @return array
     */
    public function findOverlapping(int $profesionalId, string $fecha, string $hora, int $duracionMinutos, ?int $ignoreReservaId = null): array {
        $sql = "SELECT id, hora, duracion_minutos, estado 
                FROM `reservas`
                WHERE `profesional_id` = :profesional_id
                  AND `fecha` = :fecha
                  AND `estado` != 'CANCELADA'
                  AND `hora` < ADDTIME(:hora_inicio, SEC_TO_TIME(:duracion * 60))
                  AND ADDTIME(`hora`, SEC_TO_TIME(`duracion_minutos` * 60)) > :hora_limite";

        $horaFormatted = strlen($hora) === 5 ? $hora . ':00' : $hora;

        $params = [
            ':profesional_id' => $profesionalId,
            ':fecha'          => $fecha,
            ':hora_inicio'    => $horaFormatted,
            ':duracion'       => $duracionMinutos,
            ':hora_limite'    => $horaFormatted
        ];

        if ($ignoreReservaId !== null) {
            $sql .= " AND `id` != :ignore_id";
            $params[':ignore_id'] = $ignoreReservaId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Retorna todas las reservas activas de una fecha para el cálculo de slots de disponibilidad.
     *
     * @param int $profesionalId
     * @param string $fecha
     * @return array
     */
    public function getActivasPorFecha(int $profesionalId, string $fecha): array {
        $sql = "SELECT id, hora, duracion_minutos, estado 
                FROM `reservas`
                WHERE `profesional_id` = :profesional_id
                  AND `fecha` = :fecha
                  AND `estado` != 'CANCELADA'
                ORDER BY `hora` ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':profesional_id' => $profesionalId,
            ':fecha'          => $fecha
        ]);
        return $stmt->fetchAll();
    }

    /**
     * Cuenta la cantidad de reservas activas (no canceladas) para una misma fecha y hora.
     *
     * @param string $fecha (YYYY-MM-DD)
     * @param string $hora (HH:MM o HH:MM:SS)
     * @param int|null $profesionalId
     * @param int|null $ignoreReservaId
     * @return int
     */
    public function countActivasPorFechaHora(string $fecha, string $hora, ?int $profesionalId = null, ?int $ignoreReservaId = null): int {
        $horaFormatted = strlen($hora) === 5 ? $hora . ':00' : $hora;
        $sql = "SELECT COUNT(*) FROM `reservas`
                WHERE `fecha` = :fecha
                  AND `hora` = :hora
                  AND `estado` != 'CANCELADA'";

        $params = [
            ':fecha' => $fecha,
            ':hora'  => $horaFormatted
        ];

        if ($profesionalId !== null && $profesionalId > 0) {
            $sql .= " AND `profesional_id` = :profesional_id";
            $params[':profesional_id'] = $profesionalId;
        }

        if ($ignoreReservaId !== null) {
            $sql .= " AND `id` != :ignore_id";
            $params[':ignore_id'] = $ignoreReservaId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int)$stmt->fetchColumn();
    }
}
