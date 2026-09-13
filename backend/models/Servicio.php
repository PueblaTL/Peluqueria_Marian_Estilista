<?php
/**
 * Servicio.php - Modelo de Entidad Servicio
 * Marian Estilista - Backend
 */

class Servicio {
    public ?int $id;
    public string $nombre;
    public string $categoria;
    public ?string $descripcion;
    public float $precio;
    public int $duracionMinutos;
    public ?string $imagen;
    public bool $destacado;
    public bool $activo;
    public ?string $createdAt;
    public ?string $updatedAt;

    public function __construct(array $data = []) {
        $this->id = isset($data['id']) ? (int)$data['id'] : null;
        $this->nombre = $data['nombre'] ?? '';
        $this->categoria = $data['categoria'] ?? 'General';
        $this->descripcion = $data['descripcion'] ?? '';
        $this->precio = isset($data['precio']) ? (float)$data['precio'] : 0.0;
        $this->duracionMinutos = isset($data['duracion_minutos']) ? (int)$data['duracion_minutos'] : 60;
        $this->imagen = $data['imagen'] ?? '';
        $this->destacado = isset($data['destacado']) ? (bool)$data['destacado'] : true;
        $this->activo = isset($data['activo']) ? (bool)$data['activo'] : true;
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }

    public function toArray(): array {
        return [
            'id'               => $this->id,
            'nombre'           => $this->nombre,
            'categoria'        => $this->categoria,
            'descripcion'      => $this->descripcion,
            'precio'           => $this->precio,
            'duracion_minutos' => $this->duracionMinutos,
            'imagen'           => $this->imagen,
            'destacado'        => $this->destacado,
            'activo'           => $this->activo,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt
        ];
    }
}
