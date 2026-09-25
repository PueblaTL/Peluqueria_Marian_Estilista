<?php
/**
 * Inscripcion.php - Modelo de Entidad Inscripción al Curso Profesional
 * Marian Estilista - Backend
 */

class Inscripcion {
    public const ESTADOS = ['Pendiente', 'Contactado', 'Inscripto', 'completado'];
    public ?string $fechaFinalizacion;
    public ?string $certificadoCodigo;
    public ?int $id;
    public string $cursoId;
    public string $nombre;
    public ?string $apellido;
    public string $telefono;
    public string $email;
    public string $estado;
    public string $fecha;
    public ?string $createdAt;
    public ?string $updatedAt;

    public function __construct(array $data = []) {
        $this->id = isset($data['id']) ? (int)$data['id'] : null;
        $this->cursoId = $data['curso_id'] ?? $data['cursoId'] ?? 'cur-1';
        $this->nombre = trim($data['nombre'] ?? '');
        $this->apellido = isset($data['apellido']) && trim($data['apellido']) !== '' ? trim($data['apellido']) : null;
        $this->telefono = trim($data['telefono'] ?? '');
        $this->email = strtolower(trim($data['email'] ?? ''));
        
        $estado = trim($data['estado'] ?? 'Pendiente');
        $estado = $estado === 'Completado' ? 'completado' : $estado;
        $estadosValidos = self::ESTADOS;
        $this->estado = in_array($estado, $estadosValidos, true) ? $estado : 'Pendiente';
        $this->fechaFinalizacion = $data['fecha_finalizacion'] ?? null;
        $this->certificadoCodigo = $data['certificado_codigo'] ?? null;

        $this->fecha = $data['fecha'] ?? date('Y-m-d H:i:s');
        $this->createdAt = $data['created_at'] ?? $data['createdAt'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? $data['updatedAt'] ?? null;
    }

    public function toArray(): array {
        return [
            'id'        => $this->id,
            'cursoId'   => $this->cursoId,
            'nombre'    => $this->nombre,
            'apellido'  => $this->apellido,
            'telefono'  => $this->telefono,
            'email'     => $this->email,
            'estado'    => $this->estado,
            'fechaFinalizacion' => $this->fechaFinalizacion,
            'certificadoCodigo' => $this->certificadoCodigo,
            'fecha'     => $this->fecha,
            'createdAt' => $this->createdAt,
            'updatedAt' => $this->updatedAt
        ];
    }
}
