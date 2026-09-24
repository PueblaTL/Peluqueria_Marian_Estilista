<?php

class Certificado {
    public function __construct(private array $data) {}

    // Lista explícita: nunca exponer IDs internos, contactos ni PDF en la API pública.
    public function toPublicArray(): array {
        return array_intersect_key($this->data, array_flip([
            'codigo_certificado', 'nombre_alumno', 'nombre_curso', 'instructor',
            'fecha_finalizacion', 'fecha_emision', 'estado'
        ]));
    }

    public function pdf(): string {
        return $this->data['pdf'];
    }
}
