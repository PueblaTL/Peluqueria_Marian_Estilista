<?php
/**
 * Profesional.php - Modelo de Entidad Profesional
 * Marian Estilista - Backend
 */

class Profesional {
    public ?int $id;
    public string $nombre;
    public string $apellido;
    public string $especialidad;
    public ?string $descripcion;
    public ?string $imagen;
    public bool $activo;
    public ?string $createdAt;

    public function __construct(array $data = []) {
        $this->id = isset($data['id']) ? (int)$data['id'] : null;
        $this->nombre = $data['nombre'] ?? '';
        $this->apellido = $data['apellido'] ?? '';
        $this->especialidad = $data['especialidad'] ?? '';
        $this->descripcion = $data['descripcion'] ?? '';
        $this->imagen = $data['imagen'] ?? '';
        $this->activo = isset($data['activo']) ? (bool)$data['activo'] : true;
        $this->createdAt = $data['created_at'] ?? null;
    }

    public function toArray(): array {
        return [
            'id'           => $this->id,
            'nombre'       => $this->nombre,
            'apellido'     => $this->apellido,
            'nombre_completo' => trim($this->nombre . ' ' . $this->apellido),
            'especialidad' => $this->especialidad,
            'descripcion'  => $this->descripcion,
            'imagen'       => $this->imagen,
            'activo'       => $this->activo,
            'created_at'   => $this->createdAt
        ];
    }
}
