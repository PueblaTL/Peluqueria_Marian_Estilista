<?php
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Certificado.php';

class CertificadoRepository {
    private PDO $db;

    public function __construct(?PDO $db = null) {
        $this->db = $db ?? Database::getConnection();
    }

    public function transaction(callable $work): Certificado {
        $this->db->beginTransaction();
        try {
            $result = $work();
            $this->db->commit();
            return $result;
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $e;
        }
    }

    public function lockInscripcion(int $id): ?array {
        $stmt = $this->db->prepare('SELECT * FROM inscripciones_curso WHERE id = ? FOR UPDATE');
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function findByInscripcion(int $id): ?Certificado {
        $stmt = $this->db->prepare('SELECT * FROM certificados WHERE inscripcion_id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? new Certificado($row) : null;
    }

    public function findValidByToken(string $token): ?Certificado {
        $stmt = $this->db->prepare("SELECT codigo_certificado, nombre_alumno, nombre_curso, instructor, fecha_finalizacion, fecha_emision, estado FROM certificados WHERE token_validacion = ? AND estado = 'valido'");
        $stmt->execute([$token]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? new Certificado($row) : null;
    }

    public function create(array $data): Certificado {
        $stmt = $this->db->prepare('INSERT INTO certificados (inscripcion_id, curso_id, codigo_certificado, token_validacion, nombre_alumno, nombre_curso, instructor, fecha_finalizacion, fecha_emision, estado, pdf) VALUES (:inscripcion_id, :curso_id, :codigo_certificado, :token_validacion, :nombre_alumno, :nombre_curso, :instructor, :fecha_finalizacion, :fecha_emision, :estado, :pdf)');
        $stmt->execute($data);
        return new Certificado($data);
    }
}
