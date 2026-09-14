<?php
/**
 * Usuario.php - Modelo de Entidad Usuario
 * Marian Estilista - Backend
 */

class Usuario {
    public ?int $id;
    public string $nombre;
    public string $apellido;
    public string $email;
    public ?string $password;
    public ?string $telefono;
    public string $rol;
    public bool $activo;
    public ?string $createdAt;
    public ?string $updatedAt;

    public function __construct(array $data = []) {
        $this->id = isset($data['id']) ? (int)$data['id'] : null;
        $this->nombre = $data['nombre'] ?? '';
        $this->apellido = $data['apellido'] ?? '';
        $this->email = strtolower(trim($data['email'] ?? ''));
        $this->password = $data['password'] ?? null;
        $this->telefono = $data['telefono'] ?? null;
        $this->rol = $data['rol'] ?? 'CLIENTE';
        $this->activo = isset($data['activo']) ? (bool)$data['activo'] : true;
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }

    /**
     * Retorna los datos del usuario en un array seguro sin incluir la contraseña.
     *
     * @return array
     */
    public function toSafeArray(): array {
        return [
            'id'         => $this->id,
            'nombre'     => $this->nombre,
            'apellido'   => $this->apellido,
            'email'      => $this->email,
            'telefono'   => $this->telefono,
            'rol'        => $this->rol,
            'activo'     => $this->activo,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];
    }
}
