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
    public ?string $precioTexto;
    public int $duracionMinutos;
    public ?string $imagen;
    public bool $destacado;
    public bool $activo;
    public ?array $detalles;
    public ?string $createdAt;
    public ?string $updatedAt;

    public function __construct(array $data = []) {
        $this->id = isset($data['id']) ? (int)$data['id'] : null;
        $this->nombre = trim($data['nombre'] ?? '');
        $this->categoria = trim($data['categoria'] ?? 'General');
        $this->descripcion = $data['descripcion'] ?? '';
        $this->precio = isset($data['precio']) ? (float)$data['precio'] : 0.0;
        $this->duracionMinutos = isset($data['duracion_minutos']) ? (int)$data['duracion_minutos'] : (isset($data['duracionMinutos']) ? (int)$data['duracionMinutos'] : (isset($data['duracion']) ? (int)$data['duracion'] : 60));
        $this->imagen = $data['imagen'] ?? '';
        $this->destacado = isset($data['destacado']) ? (bool)$data['destacado'] : true;
        $this->activo = isset($data['activo']) ? (bool)$data['activo'] : true;

        // Asignación de precioTexto con fallback automático al catálogo oficial
        $pt = $data['precio_texto'] ?? $data['precioTexto'] ?? null;
        if (empty($pt)) {
            $pt = self::inferPrecioTexto($this->nombre, $this->precio);
        }
        $this->precioTexto = $pt;

        // Asignación de opciones de peinado si corresponde
        if (isset($data['detalles'])) {
            $this->detalles = is_string($data['detalles']) ? json_decode($data['detalles'], true) : $data['detalles'];
        } else if (stripos($this->nombre, 'Peinado') !== false) {
            $this->detalles = self::getDefaultPeinadoDetalles();
        } else {
            $this->detalles = null;
        }

        $this->createdAt = $data['created_at'] ?? null;
        $this->updatedAt = $data['updated_at'] ?? null;
    }

    public static function inferPrecioTexto(string $nombre, float $precio): string {
        $n = mb_strtolower(trim($nombre), 'UTF-8');
        if (strpos($n, 'alisado') !== false || strpos($n, 'balayage') !== false || strpos($n, 'localizadas') !== false || strpos($n, 'babylight') !== false) {
            return '$150.000 a $180.000';
        }
        if (strpos($n, 'novia') !== false) {
            return 'Desde $80.000';
        }
        if ($n === 'peinados para eventos') {
            return 'Desde $30.000';
        }
        return '$' . number_format($precio, 0, ',', '.');
    }

    public static function getDefaultPeinadoDetalles(): array {
        return [
            [
                'nombre' => 'Ondas / Brushing con ondas',
                'precio' => 30000,
                'precioTexto' => '$30.000',
                'imagen' => 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
            ],
            [
                'nombre' => 'Semirrecogido',
                'precio' => 40000,
                'precioTexto' => '$40.000',
                'imagen' => 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=600&q=80'
            ],
            [
                'nombre' => 'Recogido',
                'precio' => 50000,
                'precioTexto' => '$50.000',
                'imagen' => 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80'
            ],
            [
                'nombre' => 'Peinado social / fiesta',
                'precio' => 55000,
                'precioTexto' => '$55.000',
                'imagen' => 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80'
            ],
            [
                'nombre' => 'Peinado 15 años',
                'precio' => 65000,
                'precioTexto' => '$65.000',
                'imagen' => 'https://images.unsplash.com/photo-1595867818082-083862f3d630?auto=format&fit=crop&w=600&q=80'
            ],
            [
                'nombre' => 'Peinado de novia',
                'precio' => 80000,
                'precioTexto' => 'desde $80.000',
                'imagen' => 'https://images.unsplash.com/photo-1511285560929-80b456503681?auto=format&fit=crop&w=600&q=80'
            ],
            [
                'nombre' => 'Prueba de peinado',
                'precio' => 35000,
                'precioTexto' => '$35.000',
                'imagen' => 'https://images.unsplash.com/photo-1560066984-138daaa5a80e?auto=format&fit=crop&w=600&q=80'
            ]
        ];
    }

    public function toArray(): array {
        return [
            'id'               => $this->id,
            'nombre'           => $this->nombre,
            'categoria'        => $this->categoria,
            'descripcion'      => $this->descripcion,
            'precio'           => $this->precio,
            'precio_texto'     => $this->precioTexto,
            'precioTexto'      => $this->precioTexto,
            'duracion'         => $this->duracionMinutos,
            'duracion_minutos' => $this->duracionMinutos,
            'duracionMinutos'  => $this->duracionMinutos,
            'imagen'           => $this->imagen,
            'destacado'        => $this->destacado,
            'activo'           => $this->activo,
            'detalles'         => $this->detalles,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt
        ];
    }
}
