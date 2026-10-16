<?php
/**
 * InscripcionService.php - Capa de Lógica de Negocio para Inscripciones del Curso
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../repositories/InscripcionRepository.php';
require_once __DIR__ . '/../config/helpers.php';

class InscripcionService {
    private InscripcionRepository $repository;

    public static function validarFechaFinalizacion($value): string {
        if (!is_string($value) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) {
            throw new DomainException('Seleccioná una fecha de finalización válida.', 400);
        }
        $fecha = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        if (!$fecha || $fecha->format('Y-m-d') !== $value || $value < '1000-01-01') {
            throw new DomainException('La fecha de finalización no es válida.', 400);
        }
        if ($value > date('Y-m-d')) {
            throw new DomainException('La fecha de finalización no puede ser futura.', 400);
        }
        return $value;
    }

    public function __construct() {
        $this->repository = new InscripcionRepository();
    }

    /**
     * Obtiene todas las inscripciones.
     *
     * @return array Array de arrays con la información serializada
     */
    public function getAll(): array {
        $inscripciones = $this->repository->getAll();
        return array_map(fn(Inscripcion $ins) => $ins->toArray(), $inscripciones);
    }

    /**
     * Obtiene una inscripción por su ID.
     *
     * @param int $id
     * @return array
     * @throws Exception
     */
    public function getById(int $id): array {
        $ins = $this->repository->getById($id);
        if (!$ins) {
            throw new Exception("Inscripción no encontrada.", 404);
        }
        return $ins->toArray();
    }

    /**
     * Crea una nueva inscripción validando datos y previniendo duplicados.
     *
     * @param array $data
     * @return array
     * @throws Exception
     */
    public function create(array $data): array {
        $nombre = trim($data['nombre'] ?? '');
        $apellido = isset($data['apellido']) && trim($data['apellido']) !== '' ? trim($data['apellido']) : null;
        $telefono = trim($data['telefono'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $cursoId = trim($data['curso_id'] ?? $data['cursoId'] ?? 'cur-1');
        $estado = trim($data['estado'] ?? 'Pendiente');

        // 1. Validaciones requeridas
        if (empty($nombre)) {
            throw new Exception("El nombre es obligatorio.", 400);
        }
        if (mb_strlen($nombre, 'UTF-8') < 2) {
            throw new Exception("El nombre debe tener al menos 2 caracteres.", 400);
        }

        if (empty($telefono)) {
            throw new Exception("El teléfono de contacto es obligatorio.", 400);
        }
        $digitos = preg_replace('/\D/', '', $telefono);
        if (strlen($digitos) < 7) {
            throw new Exception("El teléfono ingresado no es válido.", 400);
        }

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("El correo electrónico no es válido.", 400);
        }

        $estado = $estado === 'Completado' ? 'completado' : $estado;
        $estadosValidos = Inscripcion::ESTADOS;
        if (!in_array($estado, $estadosValidos, true)) {
            $estado = 'Pendiente';
        }
        $fechaFinalizacion = $estado === 'completado'
            ? self::validarFechaFinalizacion($data['fecha_finalizacion'] ?? null)
            : null;

        // 2. Control de duplicados por email y curso
        $existente = $this->repository->findByEmailAndCurso($email, $cursoId);
        if ($existente) {
            throw new Exception("Ya existe una postulación o inscripción registrada con el correo: $email", 409);
        }

        // 3. Crear entidad y persistir
        $inscripcion = new Inscripcion([
            'curso_id' => $cursoId,
            'nombre'   => $nombre,
            'apellido' => $apellido,
            'telefono' => $telefono,
            'email'    => $email,
            'estado'   => $estado,
            'fecha_finalizacion' => $fechaFinalizacion,
            'fecha'    => date('Y-m-d H:i:s')
        ]);

        $id = $this->repository->create($inscripcion);
        return $this->getById($id);
    }

    /**
     * Actualiza el estado de una inscripción existente.
     *
     * @param int $id
     * @param string $nuevoEstado
     * @return array
     * @throws Exception
     */
    public function updateEstado(int $id, string $nuevoEstado, $fechaFinalizacion = null): array {
        $ins = $this->repository->getById($id);
        if (!$ins) {
            throw new Exception("Inscripción no encontrada.", 404);
        }

        $nuevoEstado = $nuevoEstado === 'Completado' ? 'completado' : $nuevoEstado;
        $estadosValidos = Inscripcion::ESTADOS;
        if (!in_array($nuevoEstado, $estadosValidos, true)) {
            throw new Exception("Estado de inscripción no válido.", 400);
        }

        $fecha = $nuevoEstado === 'completado'
            ? self::validarFechaFinalizacion($fechaFinalizacion)
            : null;
        $this->repository->updateEstado($id, $nuevoEstado, $fecha);
        return $this->getById($id);
    }

    /**
     * Elimina físicamente una inscripción.
     *
     * @param int $id
     * @return bool
     * @throws Exception
     */
    public function delete(int $id): bool {
        $ins = $this->repository->getById($id);
        if (!$ins) {
            throw new Exception("Inscripción no encontrada.", 404);
        }

        return $this->repository->delete($id);
    }
}
