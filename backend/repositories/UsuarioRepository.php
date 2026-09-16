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
        $sql = "INSERT INTO `usuarios` (`nombre`, `apellido`, `email`, `password`, `telefono`, `rol`, `email_verificado`, `token_verificacion`, `token_expiracion`, `ultimo_reenvio_correo`, `activo`, `created_at`)
                VALUES (:nombre, :apellido, :email, :password, :telefono, :rol, :email_verificado, :token_verificacion, :token_expiracion, :ultimo_reenvio_correo, :activo, NOW())";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre'                => $usuario->nombre,
            ':apellido'              => $usuario->apellido,
            ':email'                 => $usuario->email,
            ':password'              => $usuario->password,
            ':telefono'              => $usuario->telefono,
            ':rol'                   => $usuario->rol,
            ':email_verificado'      => $usuario->emailVerificado ? 1 : 0,
            ':token_verificacion'    => $usuario->tokenVerificacion,
            ':token_expiracion'      => $usuario->tokenExpiracion,
            ':ultimo_reenvio_correo' => $usuario->ultimoReenvioCorreo,
            ':activo'                => $usuario->activo ? 1 : 0
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Busca un usuario mediante su token de verificación activo.
     *
     * @param string $token
     * @return Usuario|null
     */
    public function findByToken(string $token): ?Usuario {
        $sql = "SELECT * FROM `usuarios` WHERE `token_verificacion` = :token LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':token' => trim($token)]);
        $row = $stmt->fetch();

        return $row ? new Usuario($row) : null;
    }

    /**
     * Marca el correo de un usuario como verificado y elimina el token de un solo uso.
     *
     * @param int $userId
     * @return bool
     */
    public function marcarEmailVerificado(int $userId): bool {
        $sql = "UPDATE `usuarios` 
                SET `email_verificado` = 1,
                    `token_verificacion` = NULL,
                    `token_expiracion` = NULL,
                    `updated_at` = NOW()
                WHERE `id` = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $userId]);
    }

    /**
     * Actualiza el token de verificación y la fecha del último reenvío (con control anti-spam).
     *
     * @param int $userId
     * @param string $token
     * @param string $expiracion (formato YYYY-MM-DD HH:MM:SS)
     * @return bool
     */
    public function actualizarTokenVerificacion(int $userId, string $token, string $expiracion): bool {
        $sql = "UPDATE `usuarios` 
                SET `token_verificacion` = :token,
                    `token_expiracion` = :expiracion,
                    `ultimo_reenvio_correo` = NOW(),
                    `updated_at` = NOW()
                WHERE `id` = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':id'         => $userId,
            ':token'      => $token,
            ':expiracion' => $expiracion
        ]);
    }

    /**
     * Actualiza el teléfono de un cliente si difiere o si estaba vacío.
     *
     * @param int $userId
     * @param string $telefono
     * @return bool
     */
    public function actualizarTelefono(int $userId, string $telefono): bool {
        $sql = "UPDATE `usuarios` SET `telefono` = :telefono, `updated_at` = NOW() WHERE `id` = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':id'       => $userId,
            ':telefono' => $telefono
        ]);
    }

    /**
     * Actualiza datos básicos de contacto del cliente (nombre, apellido, teléfono).
     *
     * @param int $userId
     * @param string $nombre
     * @param string $apellido
     * @param string $telefono
     * @return bool
     */
    public function actualizarDatosCliente(int $userId, string $nombre, string $apellido, string $telefono): bool {
        $sql = "UPDATE `usuarios` 
                SET `nombre` = :nombre,
                    `apellido` = :apellido,
                    `telefono` = :telefono,
                    `updated_at` = NOW()
                WHERE `id` = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':id'       => $userId,
            ':nombre'   => $nombre,
            ':apellido' => $apellido,
            ':telefono' => $telefono
        ]);
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
