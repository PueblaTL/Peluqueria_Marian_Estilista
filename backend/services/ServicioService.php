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

    public function getAll(bool $soloActivos = true): array {
        $servicios = $this->servicioRepo->getAll($soloActivos);
        return array_map(fn($s) => $s->toArray(), $servicios);
    }

    public function getById(int $id): array {
        $servicio = $this->servicioRepo->getById($id);
        if (!$servicio) {
            throw new Exception("El servicio solicitado (ID $id) no existe.", 404);
        }
        return $servicio->toArray();
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
            'duracion_minutos' => (int)($data['duracion_minutos'] ?? $data['duracionMinutos'] ?? 60),
            'imagen'           => trim($data['imagen'] ?? 'assets/images/mechas_balayage.webp'),
            'destacado'        => !empty($data['destacado']),
            'activo'           => isset($data['activo']) ? (bool)$data['activo'] : true
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
        if (isset($data['duracion_minutos'])) $existente->duracionMinutos = (int)$data['duracion_minutos'];
        if (isset($data['duracionMinutos'])) $existente->duracionMinutos = (int)$data['duracionMinutos'];
        if (isset($data['imagen'])) $existente->imagen = trim($data['imagen']);
        if (isset($data['destacado'])) $existente->destacado = (bool)$data['destacado'];
        if (isset($data['activo'])) $existente->activo = (bool)$data['activo'];

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
