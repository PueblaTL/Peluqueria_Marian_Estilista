<?php
/**
 * Reserva.php - Modelo de Entidad Reserva / Turno
 * Marian Estilista - Backend
 */

class Reserva {
    public ?int $id;
    public int $usuarioId;
    public int $profesionalId;
    public int $servicioId;
    public string $fecha;
    public string $hora;
    public int $duracionMinutos;
    public float $precio;
    public string $estado;
    public ?string $observaciones;
    public ?string $createdAt;
    public ?string $updatedAt;

    // Relaciones pobladas opcionalmente en JOINs
    public ?string $usuarioNombre = null;
    public ?string $usuarioApellido = null;
    public ?string $usuarioEmail = null;
    public ?string $usuarioTelefono = null;
    public ?string $servicioNombre = null;
    public ?string $servicioCategoria = null;
    public ?string $profesionalNombre = null;

    public function __construct(array $data = []) {
        $this->id = isset($data['id']) ? (int)$data['id'] : null;
        $this->usuarioId = isset($data['usuario_id']) ? (int)$data['usuario_id'] : 0;
        $this->profesionalId = isset($data['profesional_id']) ? (int)$data['profesional_id'] : 0;
        $this->servicioId = isset($data['servicio_id']) ? (int)$data['servicio_id'] : 0;
        $this->fecha = $data['fecha'] ?? '';
        $this->hora = $data['hora'] ?? '';
        $this->duracionMinutos = isset($data['duracion_minutos']) ? (int)$data['duracion_minutos'] : 60;
        $this->precio = isset($data['precio']) ? (float)$data['precio'] : 0.0;
        $this->estado = $data['estado'] ?? 'PENDIENTE';
        $this->observaciones = $data['observaciones'] ?? null;
        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;

        // Campos de joins si existen
        $this->usuarioNombre = $data['usuario_nombre'] ?? null;
        $this->usuarioApellido = $data['usuario_apellido'] ?? null;
        $this->usuarioEmail = $data['usuario_email'] ?? null;
        $this->usuarioTelefono = $data['usuario_telefono'] ?? null;
        $this->servicioNombre = $data['servicio_nombre'] ?? null;
        $this->servicioCategoria = $data['servicio_categoria'] ?? null;
        $this->profesionalNombre = $data['profesional_nombre'] ?? null;
    }

    public function toArray(): array {
        $arr = [
            'id'               => $this->id,
            'usuario_id'       => $this->usuarioId,
            'profesional_id'   => $this->profesionalId,
            'servicio_id'      => $this->servicioId,
            'fecha'            => $this->fecha,
            'hora'             => substr($this->hora, 0, 5), // Formato HH:MM
            'duracion_minutos' => $this->duracionMinutos,
            'precio'           => $this->precio,
            'estado'           => $this->estado,
            'observaciones'    => $this->observaciones,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt
        ];

        if ($this->servicioNombre !== null) {
            $arr['servicio_nombre'] = $this->servicioNombre;
            $arr['servicio_categoria'] = $this->servicioCategoria;
        }

        if ($this->profesionalNombre !== null) {
            $arr['profesional_nombre'] = $this->profesionalNombre;
        }

        if ($this->usuarioNombre !== null) {
            $arr['cliente'] = [
                'nombre'   => $this->usuarioNombre,
                'apellido' => $this->usuarioApellido,
                'email'    => $this->usuarioEmail,
                'telefono' => $this->usuarioTelefono
            ];
        }

        return $arr;
    }
}
