<?php
declare(strict_types=1);

final class Reservas
{
    public function __construct(private PDO $db) {}

    public function listar(array $filtros = []): array
    {
        $sql = 'SELECT r.*, p.nombre AS profesional_nombre, s.nombre AS servicio_nombre, s.categoria AS servicio_categoria
                FROM reservas r
                JOIN profesionales p ON p.id = r.profesional_id
                JOIN servicios s ON s.id = r.servicio_id';
        $params = [];
        $where = [];

        if (!empty($filtros['fecha'])) {
            $where[] = 'r.fecha = ?';
            $params[] = $filtros['fecha'];
        }
        if (!empty($filtros['estado']) && $filtros['estado'] !== 'todos') {
            $where[] = 'r.estado = ?';
            $params[] = $filtros['estado'];
        }
        if (!empty($filtros['profesional_id'])) {
            $where[] = 'r.profesional_id = ?';
            $params[] = (int) $filtros['profesional_id'];
        }
        if (!empty($filtros['q'])) {
            $where[] = '(r.cliente_nombre LIKE ? OR r.cliente_apellido LIKE ? OR r.cliente_email LIKE ? OR r.cliente_telefono LIKE ?)';
            $q = '%' . trim((string) $filtros['q']) . '%';
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
            $params[] = $q;
        }

        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY r.fecha DESC, r.hora DESC, r.id DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function buscar(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT r.*, p.nombre AS profesional_nombre, s.nombre AS servicio_nombre
             FROM reservas r
             JOIN profesionales p ON p.id = r.profesional_id
             JOIN servicios s ON s.id = r.servicio_id
             WHERE r.id = ?'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function obtenerDisponibilidad(string $fecha, int $duracionMinutos, int $profesionalId): array
    {
        $duracionMinutos = max(30, $duracionMinutos);

        // Validar formato fecha YYYY-MM-DD
        $dt = DateTimeImmutable::createFromFormat('Y-m-d', $fecha);
        if (!$dt || $dt->format('Y-m-d') !== $fecha) {
            return [];
        }

        if ($fecha < (new DateTimeImmutable('today'))->format('Y-m-d')) return [];
        $professional = $this->db->prepare('SELECT id FROM profesionales WHERE id=? AND activo=1');
        $professional->execute([$profesionalId]);
        if (!$professional->fetch()) return [];

        // Día de la semana (1 = Lunes, 7 = Domingo)
        $diaSemana = (int) $dt->format('N');
        // Salón abre de Martes (2) a Sábado (6)
        if ($diaSemana < 2 || $diaSemana > 6) {
            return [];
        }

        // Buscar reservas existentes no canceladas para ese día y profesional
        $stmt = $this->db->prepare(
            'SELECT hora, duracion_minutos
             FROM reservas
             WHERE profesional_id = ? AND fecha = ? AND estado <> "Cancelado"'
        );
        $stmt->execute([$profesionalId, $fecha]);
        $ocupados = $stmt->fetchAll();

        // REGLA DEL NEGOCIO: Máximo 2 turnos activos por día por profesional (cancelados no consumen cupo)
        if (count($ocupados) >= 2) {
            return [];
        }

        // Convertir turnos existentes a rangos de minutos desde las 00:00
        $rangosOcupados = [];
        foreach ($ocupados as $turno) {
            $partes = explode(':', (string) $turno['hora']);
            $inicioMin = (int) $partes[0] * 60 + (int) ($partes[1] ?? 0);
            $finMin = $inicioMin + (int) $turno['duracion_minutos'];
            $rangosOcupados[] = ['inicio' => $inicioMin, 'fin' => $finMin];
        }

        // Horario comercial: 09:00 (540 min) a 19:00 (1140 min)
        $horaAperturaMin = 9 * 60;
        $horaCierreMin = 19 * 60;
        $intervaloMin = 30;

        $hoy = new DateTimeImmutable('today');
        $esHoy = ($fecha === $hoy->format('Y-m-d'));
        $ahoraMin = (int) (new DateTimeImmutable())->format('H') * 60 + (int) (new DateTimeImmutable())->format('i');

        $slots = [];
        for ($min = $horaAperturaMin; $min + $duracionMinutos <= $horaCierreMin; $min += $intervaloMin) {
            $slotFin = $min + $duracionMinutos;
            $horaStr = sprintf('%02d:%02d', intdiv($min, 60), $min % 60);

            // Si es hoy y ya pasó la hora
            if ($esHoy && $min <= $ahoraMin + 30) {
                $slots[] = ['hora' => $horaStr, 'disponible' => false, 'motivo' => 'Horario pasado'];
                continue;
            }

            // Verificar solapamiento con turnos existentes
            $conflicto = false;
            foreach ($rangosOcupados as $ocupado) {
                if ($min < $ocupado['fin'] && $slotFin > $ocupado['inicio']) {
                    $conflicto = true;
                    break;
                }
            }

            $slots[] = [
                'hora' => $horaStr,
                'disponible' => !$conflicto,
                'motivo' => $conflicto ? 'Horario ocupado' : 'Disponible'
            ];
        }

        return $slots;
    }

    public function crear(array $input): array
    {
        $errors = [];

        $profesionalId = (int) ($input['profesional_id'] ?? $input['profesionalId'] ?? 0);
        $servicioId = (int) ($input['servicio_id'] ?? $input['servicioId'] ?? 0);
        $fecha = trim((string) ($input['fecha'] ?? ''));
        $rawHora = trim((string) ($input['hora'] ?? ''));
        $hora = substr($rawHora, 0, 5); // Normalizar a HH:mm
        $duracion = (int) ($input['duracion_minutos'] ?? $input['duracionMinutos'] ?? 60);
        $precio = (float) ($input['precio_estimado'] ?? $input['precio'] ?? 0);

        $cliente = $input['cliente'] ?? [];
        $nombre = trim((string) ($input['cliente_nombre'] ?? $cliente['nombre'] ?? ''));
        $apellido = trim((string) ($input['cliente_apellido'] ?? $cliente['apellido'] ?? ''));
        $email = trim((string) ($input['cliente_email'] ?? $cliente['email'] ?? ''));
        $telefono = trim((string) ($input['cliente_telefono'] ?? $cliente['telefono'] ?? ''));
        $observaciones = trim((string) ($input['observaciones'] ?? $cliente['notas'] ?? ''));

        if ($profesionalId <= 0) $errors['profesional_id'] = 'Seleccioná un profesional válido.';
        if ($servicioId <= 0) $errors['servicio_id'] = 'Seleccioná un servicio válido.';

        $dt = DateTimeImmutable::createFromFormat('Y-m-d', $fecha);
        if (!$dt || $dt->format('Y-m-d') !== $fecha) {
            $errors['fecha'] = 'Ingresá una fecha válida (YYYY-MM-DD).';
        } elseif ($fecha < (new DateTimeImmutable('today'))->format('Y-m-d')) {
            $errors['fecha'] = 'La fecha no puede ser anterior al día de hoy.';
        }

        if (!preg_match('/\A([01][0-9]|2[0-3]):[0-5][0-9]\z/', $hora)) {
            $errors['hora'] = 'Ingresá un horario válido (HH:MM).';
        }

        if (mb_strlen($nombre) < 1 || mb_strlen($nombre) > 80) $errors['cliente_nombre'] = 'Nombre requerido (1 a 80 caracteres).';
        if (mb_strlen($apellido) < 1 || mb_strlen($apellido) > 80) $errors['cliente_apellido'] = 'Apellido requerido (1 a 80 caracteres).';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) $errors['cliente_email'] = 'Email inválido.';
        if (strlen($telefono) < 6 || strlen($telefono) > 40) $errors['cliente_telefono'] = 'Teléfono requerido (al menos 6 caracteres).';

        if ($errors) {
            return ['success' => false, 'errors' => $errors];
        }

        // Transacción con verificación estricta de cupos y disponibilidad
        $this->db->beginTransaction();
        try {
            // Verificar servicio existente y tomar precio y duración oficiales si no vinieron
            $stmtSrv = $this->db->prepare('SELECT id, nombre, duracion_minutos, precio_desde FROM servicios WHERE id = ? AND activo = 1');
            $stmtSrv->execute([$servicioId]);
            $srv = $stmtSrv->fetch();
            if (!$srv) {
                $this->db->rollBack();
                return ['success' => false, 'errors' => ['servicio_id' => 'El servicio seleccionado no está disponible.']];
            }

            $duracion = (int) $srv['duracion_minutos'];
            $precio = (float) $srv['precio_desde'];

            // Verificar profesional existente
            $stmtProf = $this->db->prepare('SELECT id, nombre FROM profesionales WHERE id = ? AND activo = 1 FOR UPDATE');
            $stmtProf->execute([$profesionalId]);
            $prof = $stmtProf->fetch();
            if (!$prof) {
                $this->db->rollBack();
                return ['success' => false, 'errors' => ['profesional_id' => 'El profesional seleccionado no está disponible.']];
            }

            $slots = $this->obtenerDisponibilidad($fecha, $duracion, $profesionalId);
            if (!array_filter($slots, fn($slot) => $slot['hora'] === $hora && $slot['disponible'])) {
                $this->db->rollBack();
                return ['success'=>false,'errors'=>['hora'=>'El horario no está disponible. Elegí otro turno.']];
            }
            // REGLA DEL NEGOCIO: Verificar límite máximo de 2 reservas activas por día para el profesional
            $stmtCount = $this->db->prepare(
                'SELECT COUNT(*) FROM reservas
                 WHERE profesional_id = ? AND fecha = ? AND estado <> "Cancelado"
                 FOR UPDATE'
            );
            $stmtCount->execute([$profesionalId, $fecha]);
            $totalActivas = (int) $stmtCount->fetchColumn();
            if ($totalActivas >= 2) {
                $this->db->rollBack();
                return [
                    'success' => false,
                    'errors' => ['fecha' => 'Ya se alcanzó el límite máximo de reservas (2) para esta fecha. Seleccioná otro día.']
                ];
            }

            // Verificar solapamiento de horario con reservas existentes
            $stmtTurnos = $this->db->prepare(
                'SELECT id, hora, duracion_minutos
                 FROM reservas
                 WHERE profesional_id = ? AND fecha = ? AND estado <> "Cancelado"
                 FOR UPDATE'
            );
            $stmtTurnos->execute([$profesionalId, $fecha]);
            $existentes = $stmtTurnos->fetchAll();

            $partesHora = explode(':', $hora);
            $inicioNuevo = (int) $partesHora[0] * 60 + (int) ($partesHora[1] ?? 0);
            $finNuevo = $inicioNuevo + $duracion;

            foreach ($existentes as $ex) {
                $p = explode(':', (string) $ex['hora']);
                $iniEx = (int) $p[0] * 60 + (int) ($p[1] ?? 0);
                $finEx = $iniEx + (int) $ex['duracion_minutos'];

                if ($inicioNuevo < $finEx && $finNuevo > $iniEx) {
                    $this->db->rollBack();
                    return ['success' => false, 'errors' => ['hora' => 'El profesional ya tiene un turno reservado en ese horario. Por favor elegí otro horario.']];
                }
            }

            // Insertar la reserva
            $stmtInsert = $this->db->prepare(
                'INSERT INTO reservas (
                    profesional_id, servicio_id, fecha, hora, duracion_minutos, precio_estimado,
                    estado, cliente_nombre, cliente_apellido, cliente_email, cliente_telefono, observaciones
                ) VALUES (
                    :profesional_id, :servicio_id, :fecha, :hora, :duracion_minutos, :precio_estimado,
                    "Pendiente", :cliente_nombre, :cliente_apellido, :cliente_email, :cliente_telefono, :observaciones
                )'
            );

            $stmtInsert->execute([
                ':profesional_id' => $profesionalId,
                ':servicio_id' => $servicioId,
                ':fecha' => $fecha,
                ':hora' => $hora . ':00',
                ':duracion_minutos' => $duracion,
                ':precio_estimado' => $precio,
                ':cliente_nombre' => $nombre,
                ':cliente_apellido' => $apellido,
                ':cliente_email' => $email,
                ':cliente_telefono' => $telefono,
                ':observaciones' => $observaciones !== '' ? $observaciones : null,
            ]);

            $idGenerado = (int) $this->db->lastInsertId();
            $this->db->commit();

            return [
                'success' => true,
                'id' => $idGenerado,
                'codigo' => 'TRN-' . str_pad((string) $idGenerado, 4, '0', STR_PAD_LEFT),
                'reserva' => [
                    'id' => $idGenerado,
                    'codigo' => 'TRN-' . str_pad((string) $idGenerado, 4, '0', STR_PAD_LEFT),
                    'profesional_id' => $profesionalId,
                    'profesional_nombre' => $prof['nombre'],
                    'servicio_id' => $servicioId,
                    'servicio_nombre' => $srv['nombre'],
                    'fecha' => $fecha,
                    'hora' => $hora,
                    'duracion_minutos' => $duracion,
                    'precio_estimado' => $precio,
                    'estado' => 'Pendiente',
                    'cliente_nombre' => $nombre,
                    'cliente_apellido' => $apellido,
                    'cliente_email' => $email,
                    'cliente_telefono' => $telefono,
                    'observaciones' => $observaciones
                ]
            ];
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    public function cambiarEstado(int $id, string $nuevoEstado): bool
    {
        if (!in_array($nuevoEstado, ['Pendiente', 'Confirmado', 'Cancelado', 'Completado'], true)) {
            return false;
        }
        $actual = $this->buscar($id);
        if (!$actual) {
            return false;
        }
        if ($actual['estado'] === $nuevoEstado) {
            return true;
        }
        $transiciones = ['Pendiente'=>['Confirmado','Cancelado'], 'Confirmado'=>['Completado','Cancelado'], 'Cancelado'=>[], 'Completado'=>[]];
        if (!in_array($nuevoEstado, $transiciones[$actual['estado']] ?? [], true)) return false;
        $stmt = $this->db->prepare('UPDATE reservas SET estado = ? WHERE id = ? AND estado = ?');
        $stmt->execute([$nuevoEstado, $id, $actual['estado']]);
        return $stmt->rowCount() > 0;
    }
}
