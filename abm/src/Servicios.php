<?php
declare(strict_types=1);

final class Servicios
{
    public function __construct(private PDO $db) {}

    public function listar(bool $soloActivos = true): array
    {
        $sql = 'SELECT * FROM servicios' . ($soloActivos ? ' WHERE activo = 1' : '') . ' ORDER BY id ASC';
        return $this->db->query($sql)->fetchAll();
    }

    public function buscar(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM servicios WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
}
