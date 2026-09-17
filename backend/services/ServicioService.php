<?php
/**
 * ServicioService.php - Lógica de Negocio para Servicios
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../repositories/ServicioRepository.php';

class ServicioService {
    private ServicioRepository $servicioRepo;

    public function __construct() {
        $this->servicioRepo = new ServicioRepository();
    }

    public static function getDefinitiveServices(bool $soloActivos = true): array {
        $servicios = [
            new Servicio([
                'id'               => 1,
                'nombre'           => 'Alisado Láser 6D',
                'categoria'        => 'Alisados',
                'descripcion'      => 'Técnica avanzada de alisado y disciplina capilar. Incluye tratamiento termoactivo, sellado de la fibra, reducción del frizz y acabado ultra liso con brillo intenso. El valor depende del largo, volumen y cantidad de cabello.',
                'precio'           => 150000.0,
                'precio_texto'     => '$150.000 a $180.000',
                'precioTexto'      => '$150.000 a $180.000',
                'duracion_minutos' => 150,
                'duracionMinutos'  => 150,
                'imagen'           => 'assets/images/alisado_6d.webp',
                'destacado'        => true,
                'activo'           => true
            ]),
            new Servicio([
                'id'               => 2,
                'nombre'           => 'Mechas Balayage',
                'categoria'        => 'Iluminación',
                'descripcion'      => 'Iluminación personalizada con efecto degradado y luminoso, diseñada para aportar dimensión, movimiento y un resultado natural y sofisticado. Ideal para renovar tu look y realzar la belleza del cabello. El valor depende del largo, volumen y cantidad de cabello.',
                'precio'           => 150000.0,
                'precio_texto'     => '$150.000 a $180.000',
                'precioTexto'      => '$150.000 a $180.000',
                'duracion_minutos' => 180,
                'duracionMinutos'  => 180,
                'imagen'           => 'assets/images/mechas_balayage_2.webp',
                'destacado'        => true,
                'activo'           => true
            ]),
            new Servicio([
                'id'               => 3,
                'nombre'           => 'Mechas Localizadas',
                'categoria'        => 'Iluminación',
                'descripcion'      => 'Técnica personalizada que aporta luminosidad y dimensión en zonas estratégicas del cabello, resaltando las facciones del rostro. Ideal para lograr un cambio sutil, elegante y natural, adaptado a tu estilo. El valor depende del largo, volumen y cantidad de cabello.',
                'precio'           => 150000.0,
                'precio_texto'     => '$150.000 a $180.000',
                'precioTexto'      => '$150.000 a $180.000',
                'duracion_minutos' => 120,
                'duracionMinutos'  => 120,
                'imagen'           => 'assets/images/mechas_localizadas_2.webp',
                'destacado'        => true,
                'activo'           => true
            ]),
            new Servicio([
                'id'               => 4,
                'nombre'           => 'Mechas Babylight',
                'categoria'        => 'Iluminación',
                'descripcion'      => 'Mechas finas y personalizadas que crean una iluminación natural, delicada y luminosa. Aportan brillo, dimensión y un look moderno y sofisticado, logrando un efecto sutil inspirado en los reflejos naturales del cabello. El valor depende del largo, volumen y cantidad de cabello.',
                'precio'           => 150000.0,
                'precio_texto'     => '$150.000 a $180.000',
                'precioTexto'      => '$150.000 a $180.000',
                'duracion_minutos' => 150,
                'duracionMinutos'  => 150,
                'imagen'           => 'assets/images/mechas_babylight_2.webp',
                'destacado'        => true,
                'activo'           => true
            ]),
            new Servicio([
                'id'               => 5,
                'nombre'           => 'Peinados para Eventos',
                'categoria'        => 'Peinados',
                'descripcion'      => 'Peinados personalizados para quinceañeras, bodas y ocasiones especiales. Diseños pensados para que luzcas increíble en cada momento importante, adaptados a tu estilo, personalidad y ocasión.',
                'precio'           => 30000.0,
                'precio_texto'     => 'Desde $30.000',
                'precioTexto'      => 'Desde $30.000',
                'duracion_minutos' => 60,
                'duracionMinutos'  => 60,
                'imagen'           => 'assets/images/peinados_1.webp',
                'destacado'        => false,
                'activo'           => false,
                'detalles'         => Servicio::getDefaultPeinadoDetalles()
            ]),
            new Servicio([
                'id'               => 16,
                'nombre'           => 'Ondas / Brushing con ondas',
                'categoria'        => 'Peinados',
                'descripcion'      => 'Brushing con ondas suaves y definidas para lograr un acabado elegante, natural y con movimiento. Ideal para eventos, celebraciones o para darle un toque especial a tu look.',
                'precio'           => 30000.0,
                'precio_texto'     => '$30.000',
                'precioTexto'      => '$30.000',
                'duracion_minutos' => 60,
                'duracionMinutos'  => 60,
                'imagen'           => 'assets/images/peinados/peinado_ondas.jpg',
                'destacado'        => true,
                'activo'           => true
            ]),
            new Servicio([
                'id'               => 17,
                'nombre'           => 'Semirrecogido',
                'categoria'        => 'Peinados',
                'descripcion'      => 'Peinado elegante que combina el cabello suelto con secciones recogidas. Una opción versátil y delicada para eventos, fiestas y celebraciones especiales.',
                'precio'           => 40000.0,
                'precio_texto'     => '$40.000',
                'precioTexto'      => '$40.000',
                'duracion_minutos' => 60,
                'duracionMinutos'  => 60,
                'imagen'           => 'assets/images/peinados/peinado_semirrecogido.jpg',
                'destacado'        => true,
                'activo'           => true
            ]),
            new Servicio([
                'id'               => 18,
                'nombre'           => 'Recogido',
                'categoria'        => 'Peinados',
                'descripcion'      => 'Peinado completamente recogido, diseñado para lograr un look sofisticado y duradero. Ideal para eventos formales y ocasiones especiales.',
                'precio'           => 50000.0,
                'precio_texto'     => '$50.000',
                'precioTexto'      => '$50.000',
                'duracion_minutos' => 60,
                'duracionMinutos'  => 60,
                'imagen'           => 'assets/images/peinados/peinado_recogido.jpg',
                'destacado'        => true,
                'activo'           => true
            ]),
            new Servicio([
                'id'               => 19,
                'nombre'           => 'Peinado social / fiesta',
                'categoria'        => 'Peinados',
                'descripcion'      => 'Peinado personalizado para fiestas y eventos, adaptado al estilo, vestido y ocasión de cada clienta. Incluye una propuesta elegante y cuidada hasta el último detalle.',
                'precio'           => 55000.0,
                'precio_texto'     => '$55.000',
                'precioTexto'      => '$55.000',
                'duracion_minutos' => 60,
                'duracionMinutos'  => 60,
                'imagen'           => 'assets/images/peinados/peinado_social.jpg',
                'destacado'        => true,
                'activo'           => true
            ]),
            new Servicio([
                'id'               => 20,
                'nombre'           => 'Peinado 15 años',
                'categoria'        => 'Peinados',
                'descripcion'      => 'Peinado especialmente diseñado para celebraciones de 15 años, buscando un resultado elegante, juvenil y acorde al estilo elegido para una ocasión única.',
                'precio'           => 65000.0,
                'precio_texto'     => '$65.000',
                'precioTexto'      => '$65.000',
                'duracion_minutos' => 90,
                'duracionMinutos'  => 90,
                'imagen'           => 'assets/images/peinados/peinado_15anos.jpg',
                'destacado'        => true,
                'activo'           => true
            ]),
            new Servicio([
                'id'               => 21,
                'nombre'           => 'Peinado de novia',
                'categoria'        => 'Peinados',
                'descripcion'      => 'Peinado personalizado para novias, diseñado de acuerdo con el vestido, accesorios, estilo de la celebración y preferencias de cada clienta. El precio es desde $80.000 y puede variar según la complejidad del trabajo.',
                'precio'           => 80000.0,
                'precio_texto'     => 'Desde $80.000',
                'precioTexto'      => 'Desde $80.000',
                'duracion_minutos' => 90,
                'duracionMinutos'  => 90,
                'imagen'           => 'assets/images/peinados/peinado_novia.jpg',
                'destacado'        => true,
                'activo'           => true
            ]),
            new Servicio([
                'id'               => 22,
                'nombre'           => 'Prueba de peinado',
                'categoria'        => 'Peinados',
                'descripcion'      => 'Prueba previa para definir y ajustar el peinado elegido antes del evento. Permite evaluar el estilo, volumen, accesorios y terminación para llegar al día especial con todo definido.',
                'precio'           => 35000.0,
                'precio_texto'     => '$35.000',
                'precioTexto'      => '$35.000',
                'duracion_minutos' => 60,
                'duracionMinutos'  => 60,
                'imagen'           => 'assets/images/peinados/peinado_prueba.jpg',
                'destacado'        => true,
                'activo'           => true
            ])
        ];

        if ($soloActivos) {
            $servicios = array_filter($servicios, fn($s) => $s->activo);
        }

        return array_map(fn($s) => $s->toArray(), $servicios);
    }

    public function getAll(bool $soloActivos = true): array {
        try {
            $servicios = $this->servicioRepo->getAll($soloActivos);
            if (!empty($servicios)) {
                return array_map(fn($s) => $s->toArray(), $servicios);
            }
        } catch (Throwable $e) {
            error_log("ServicioService::getAll fallback activado por BD: " . $e->getMessage());
        }
        return self::getDefinitiveServices($soloActivos);
    }

    public function getById(int $id): array {
        try {
            $servicio = $this->servicioRepo->getById($id);
            if ($servicio) {
                return $servicio->toArray();
            }
        } catch (Throwable $e) {
            error_log("ServicioService::getById fallback activado: " . $e->getMessage());
        }

        $def = self::getDefinitiveServices(false);
        foreach ($def as $s) {
            if ((int)$s['id'] === $id) {
                return $s;
            }
        }

        throw new Exception("El servicio solicitado (ID $id) no existe.", 404);
    }

    public function create(array $data): array {
        $nombre = trim($data['nombre'] ?? '');
        if (empty($nombre)) {
            throw new Exception("El nombre del servicio es obligatorio.", 400);
        }

        $servicio = new Servicio([
            'nombre'           => $nombre,
            'categoria'        => trim($data['categoria'] ?? 'General'),
            'descripcion'      => trim($data['descripcion'] ?? ''),
            'precio'           => (float)($data['precio'] ?? 0),
            'precio_texto'     => trim($data['precio_texto'] ?? $data['precioTexto'] ?? ''),
            'precioTexto'      => trim($data['precio_texto'] ?? $data['precioTexto'] ?? ''),
            'duracion_minutos' => (int)($data['duracion_minutos'] ?? $data['duracionMinutos'] ?? $data['duracion'] ?? 60),
            'imagen'           => trim($data['imagen'] ?? 'assets/images/mechas_balayage_2.webp'),
            'destacado'        => !empty($data['destacado']),
            'activo'           => isset($data['activo']) ? (bool)$data['activo'] : true,
            'detalles'         => $data['detalles'] ?? null
        ]);

        $id = $this->servicioRepo->create($servicio);
        $servicio->id = $id;

        return $servicio->toArray();
    }

    public function update(int $id, array $data): array {
        $existente = $this->servicioRepo->getById($id);
        if (!$existente) {
            throw new Exception("El servicio con ID $id no existe.", 404);
        }

        if (isset($data['nombre'])) $existente->nombre = trim($data['nombre']);
        if (isset($data['categoria'])) $existente->categoria = trim($data['categoria']);
        if (isset($data['descripcion'])) $existente->descripcion = trim($data['descripcion']);
        if (isset($data['precio'])) $existente->precio = (float)$data['precio'];
        if (isset($data['precio_texto'])) $existente->precioTexto = trim($data['precio_texto']);
        if (isset($data['precioTexto'])) $existente->precioTexto = trim($data['precioTexto']);
        if (isset($data['duracion_minutos'])) $existente->duracionMinutos = (int)$data['duracion_minutos'];
        if (isset($data['duracionMinutos'])) $existente->duracionMinutos = (int)$data['duracionMinutos'];
        if (isset($data['duracion'])) $existente->duracionMinutos = (int)$data['duracion'];
        if (isset($data['imagen'])) $existente->imagen = trim($data['imagen']);
        if (isset($data['destacado'])) $existente->destacado = (bool)$data['destacado'];
        if (isset($data['activo'])) $existente->activo = (bool)$data['activo'];
        if (isset($data['detalles'])) $existente->detalles = is_string($data['detalles']) ? json_decode($data['detalles'], true) : $data['detalles'];

        $this->servicioRepo->update($existente);
        return $existente->toArray();
    }

    public function delete(int $id): bool {
        $existente = $this->servicioRepo->getById($id);
        if (!$existente) {
            throw new Exception("El servicio con ID $id no existe.", 404);
        }
        return $this->servicioRepo->delete($id);
    }
}
