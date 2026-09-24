<?php
require_once __DIR__ . '/../repositories/CertificadoRepository.php';
require_once __DIR__ . '/CertificadoPdfService.php';

class CertificadoService {
    private CertificadoRepository $repository;

    public function __construct(?CertificadoRepository $repository = null) {
        $this->repository = $repository ?? new CertificadoRepository();
    }

    public function generar(int $inscripcionId): Certificado {
        return $this->repository->transaction(function () use ($inscripcionId) {
            // Consulta fresca y bloqueo compartido con UPDATE/DELETE de inscripciones.
            $ins = $this->repository->lockInscripcion($inscripcionId);
            if (!$ins) throw new DomainException('Inscripción no encontrada.', 404);
            if ($ins['estado'] !== 'completado') {
                throw new DomainException('El certificado solo puede generarse cuando el curso haya sido completado.', 409);
            }
            $existente = $this->repository->findByInscripcion($inscripcionId);
            if ($existente) return $existente;

            $cursos = require __DIR__ . '/../config/cursos.php';
            $curso = $cursos[$ins['curso_id']] ?? null;
            if (!$curso || empty($ins['fecha_finalizacion'])) {
                throw new DomainException('Revisá el curso y la fecha de finalización de la inscripción.', 409);
            }
            $data = [
                'inscripcion_id' => $inscripcionId,
                'curso_id' => $ins['curso_id'],
                'codigo_certificado' => 'ME-CERT-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(8))),
                'token_validacion' => bin2hex(random_bytes(32)),
                'nombre_alumno' => trim($ins['nombre'] . ' ' . ($ins['apellido'] ?? '')),
                'nombre_curso' => $curso['nombre'],
                'instructor' => $curso['instructor'],
                'fecha_finalizacion' => $ins['fecha_finalizacion'],
                'fecha_emision' => date('Y-m-d H:i:s'),
                'estado' => 'valido',
            ];
            // Si el PDF falla, la transacción no deja un certificado incompleto.
            $data['pdf'] = CertificadoPdfService::generar($data);
            return $this->repository->create($data);
        });
    }

    public function obtener(int $inscripcionId): Certificado {
        $certificado = $this->repository->findByInscripcion($inscripcionId);
        if (!$certificado) throw new DomainException('Certificado no encontrado.', 404);
        return $certificado;
    }

    public function validar(string $token): Certificado {
        if (!preg_match('/\A[a-f0-9]{64}\z/', $token)) {
            throw new DomainException('Certificado no válido.', 404);
        }
        $certificado = $this->repository->findValidByToken($token);
        if (!$certificado) throw new DomainException('Certificado no válido.', 404);
        return $certificado;
    }
}
