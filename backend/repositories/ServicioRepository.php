<?php
/**
 * ServicioRepository.php - Acceso a Datos para el catálogo de Servicios
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Servicio.php';

class ServicioRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Obtiene el listado de servicios.
     *
     * @param bool $soloActivos Si es true, filtra solo servicios activos
     * @return Servicio[]
     */
    public function getAll(bool $soloActivos = true): array {
        $sql = "SELECT * FROM `servicios`";
        if ($soloActivos) {
            $sql .= " WHERE `activo` = 1";
        }
        $sql .= " ORDER BY `id` ASC";

        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll();

        $servicios = [];
        foreach ($rows as $row) {
            $servicios[] = new Servicio($row);
        }
        return $servicios;
    }

    /**
     * Busca un servicio por su ID primario.
     *
     * @param int $id
     * @return Servicio|null
     */
    public function getById(int $id): ?Servicio {
        $sql = "SELECT * FROM `servicios` WHERE `id` = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        return $row ? new Servicio($row) : null;
    }

    /**
     * Crea un nuevo servicio en la base de datos.
     *
     * @param Servicio $servicio
     * @return int ID generado
     */
    public function create(Servicio $servicio): int {
        try {
            $sql = "INSERT INTO `servicios` (`nombre`, `categoria`, `descripcion`, `precio`, `precio_texto`, `duracion_minutos`, `imagen`, `destacado`, `activo`, `detalles`, `created_at`)
                    VALUES (:nombre, :categoria, :descripcion, :precio, :precio_texto, :duracion_minutos, :imagen, :destacado, :activo, :detalles, NOW())";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':nombre'           => $servicio->nombre,
                ':categoria'        => $servicio->categoria,
                ':descripcion'      => $servicio->descripcion,
                ':precio'           => $servicio->precio,
                ':precio_texto'     => $servicio->precioTexto,
                ':duracion_minutos' => $servicio->duracionMinutos,
                ':imagen'           => $servicio->imagen,
                ':destacado'        => $servicio->destacado ? 1 : 0,
                ':activo'           => $servicio->activo ? 1 : 0,
                ':detalles'         => $servicio->detalles ? json_encode($servicio->detalles, JSON_UNESCAPED_UNICODE) : null
            ]);
            return (int)$this->db->lastInsertId();
        } catch (PDOException $e) {
            if ($e->getCode() == 23000 || strpos($e->getMessage(), '1062') !== false) {
                throw new Exception("Ya existe un servicio registrado con el nombre '{$servicio->nombre}'. Por favor elige otro nombre.", 400);
            }
            // Fallback para esquemas antiguos sin columnas adicionales
            try {
                $sql = "INSERT INTO `servicios` (`nombre`, `categoria`, `descripcion`, `precio`, `duracion_minutos`, `imagen`, `destacado`, `activo`, `created_at`)
                        VALUES (:nombre, :categoria, :descripcion, :precio, :duracion_minutos, :imagen, :destacado, :activo, NOW())";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([
                    ':nombre'           => $servicio->nombre,
                    ':categoria'        => $servicio->categoria,
                    ':descripcion'      => $servicio->descripcion,
                    ':precio'           => $servicio->precio,
                    ':duracion_minutos' => $servicio->duracionMinutos,
                    ':imagen'           => $servicio->imagen,
                    ':destacado'        => $servicio->destacado ? 1 : 0,
                    ':activo'           => $servicio->activo ? 1 : 0
                ]);
                return (int)$this->db->lastInsertId();
            } catch (Throwable $e2) {
                error_log("ServicioRepository::create error: " . $e->getMessage());
                throw new Exception("Error al registrar el servicio: " . $e->getMessage(), 500);
            }
        }
    }

    /**
     * Actualiza los datos de un servicio existente.
     *
     * @param Servicio $servicio
     * @return bool
     */
    public function update(Servicio $servicio): bool {
        try {
            $sql = "UPDATE `servicios` SET
                        `nombre` = :nombre,
                        `categoria` = :categoria,
                        `descripcion` = :descripcion,
                        `precio` = :precio,
                        `precio_texto` = :precio_texto,
                        `duracion_minutos` = :duracion_minutos,
                        `imagen` = :imagen,
                        `destacado` = :destacado,
                        `activo` = :activo,
                        `detalles` = :detalles
                    WHERE `id` = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                ':id'               => $servicio->id,
                ':nombre'           => $servicio->nombre,
                ':categoria'        => $servicio->categoria,
                ':descripcion'      => $servicio->descripcion,
                ':precio'           => $servicio->precio,
                ':precio_texto'     => $servicio->precioTexto,
                ':duracion_minutos' => $servicio->duracionMinutos,
                ':imagen'           => $servicio->imagen,
                ':destacado'        => $servicio->destacado ? 1 : 0,
                ':activo'           => $servicio->activo ? 1 : 0,
                ':detalles'         => $servicio->detalles ? json_encode($servicio->detalles, JSON_UNESCAPED_UNICODE) : null
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000 || strpos($e->getMessage(), '1062') !== false) {
                throw new Exception("Ya existe otro servicio con el nombre '{$servicio->nombre}'.", 400);
            }
            try {
                $sql = "UPDATE `servicios` SET
                            `nombre` = :nombre,
                            `categoria` = :categoria,
                            `descripcion` = :descripcion,
                            `precio` = :precio,
                            `duracion_minutos` = :duracion_minutos,
                            `imagen` = :imagen,
                            `destacado` = :destacado,
                            `activo` = :activo
                        WHERE `id` = :id";
                $stmt = $this->db->prepare($sql);
                return $stmt->execute([
                    ':id'               => $servicio->id,
                    ':nombre'           => $servicio->nombre,
                    ':categoria'        => $servicio->categoria,
                    ':descripcion'      => $servicio->descripcion,
                    ':precio'           => $servicio->precio,
                    ':duracion_minutos' => $servicio->duracionMinutos,
                    ':imagen'           => $servicio->imagen,
                    ':destacado'        => $servicio->destacado ? 1 : 0,
                    ':activo'           => $servicio->activo ? 1 : 0
                ]);
            } catch (Throwable $e2) {
                error_log("ServicioRepository::update error: " . $e->getMessage());
                throw new Exception("Error al actualizar el servicio: " . $e->getMessage(), 500);
            }
        }
    }

    /**
     * Realiza una baja lógica (o física) de un servicio.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool {
        // Marcamos como inactivo para no romper integridad con reservas históricas
        $sql = "UPDATE `servicios` SET `activo` = 0 WHERE `id` = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }
}
