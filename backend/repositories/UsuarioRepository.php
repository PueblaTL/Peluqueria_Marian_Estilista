<?php
/**
 * UsuarioRepository.php - Acceso a Datos para la entidad Usuario
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Usuario.php';

class UsuarioRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Busca un usuario por su dirección de email.
     *
     * @param string $email
     * @return Usuario|null
     */
    public function findByEmail(string $email): ?Usuario {
        $sql = "SELECT * FROM `usuarios` WHERE `email` = :email LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => strtolower(trim($email))]);
        $row = $stmt->fetch();

        return $row ? new Usuario($row) : null;
    }

    /**
     * Busca un usuario por su ID primario.
     *
     * @param int $id
     * @return Usuario|null
     */
    public function findById(int $id): ?Usuario {
        $sql = "SELECT * FROM `usuarios` WHERE `id` = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        return $row ? new Usuario($row) : null;
    }

    /**
     * Registra un nuevo usuario en la base de datos.
     *
     * @param Usuario $usuario
     * @return int ID generado
     */
    public function create(Usuario $usuario): int {
        $sql = "INSERT INTO `usuarios` (`nombre`, `apellido`, `email`, `password`, `telefono`, `rol`, `activo`, `created_at`)
                VALUES (:nombre, :apellido, :email, :password, :telefono, :rol, :activo, NOW())";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre'   => $usuario->nombre,
            ':apellido' => $usuario->apellido,
            ':email'    => $usuario->email,
            ':password' => $usuario->password,
            ':telefono' => $usuario->telefono,
            ':rol'      => $usuario->rol,
            ':activo'   => $usuario->activo ? 1 : 0
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Obtiene la lista de todos los usuarios registrados (para panel de administración).
     *
     * @return Usuario[]
     */
    public function listAll(): array {
        $sql = "SELECT * FROM `usuarios` ORDER BY `created_at` DESC";
        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll();

        $usuarios = [];
        foreach ($rows as $row) {
            $usuarios[] = new Usuario($row);
        }
        return $usuarios;
    }

    /**
     * Obtiene clientes (rol=CLIENTE) enriquecidos con estadísticas de sus reservas.
     * Retorna: id, nombre, apellido, email, telefono, cantidadTurnos, ultimoTurno, gastoTotal.
     *
     * @return array
     */
    public function listClientes(): array {
        $sql = "SELECT 
                    u.id,
                    u.nombre,
                    u.apellido,
                    u.email,
                    u.telefono,
                    u.activo,
                    u.created_at,
                    COUNT(r.id)          AS cantidad_turnos,
                    MAX(r.fecha)         AS ultimo_turno,
                    COALESCE(SUM(r.precio), 0) AS gasto_total
                FROM `usuarios` u
                LEFT JOIN `reservas` r ON r.usuario_id = u.id AND r.estado != 'CANCELADA'
                WHERE u.rol = 'CLIENTE' AND u.activo = 1
                GROUP BY u.id, u.nombre, u.apellido, u.email, u.telefono, u.activo, u.created_at
                ORDER BY cantidad_turnos DESC, u.created_at DESC";

        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll();

        return array_map(fn($row) => [
            'id'             => (int)$row['id'],
            'nombre'         => $row['nombre'],
            'apellido'       => $row['apellido'],
            'email'          => $row['email'],
            'telefono'       => $row['telefono'] ?? '',
            'activo'         => (bool)$row['activo'],
            'cantidadTurnos' => (int)$row['cantidad_turnos'],
            'ultimoTurno'    => $row['ultimo_turno'] ?? 'Sin turnos',
            'gastoTotal'     => (float)$row['gasto_total'],
            'createdAt'      => $row['created_at']
        ], $rows);
    }

    /**
     * Cuenta la cantidad total de clientes registrados.
     *
     * @return int
     */
    public function countClientes(): int {
        $sql = "SELECT COUNT(*) FROM `usuarios` WHERE `rol` = 'CLIENTE' AND `activo` = 1";
        return (int)$this->db->query($sql)->fetchColumn();
    }
}
