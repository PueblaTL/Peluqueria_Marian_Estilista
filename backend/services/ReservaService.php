<?php
/**
 * ReservaService.php - Lógica de Negocio y Control de Disponibilidad de Reservas
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../repositories/ReservaRepository.php';
require_once __DIR__ . '/../repositories/ServicioRepository.php';
require_once __DIR__ . '/../repositories/ProfesionalRepository.php';
require_once __DIR__ . '/../repositories/UsuarioRepository.php';

class ReservaService {
    private ReservaRepository $reservaRepo;
    private ServicioRepository $servicioRepo;
    private ProfesionalRepository $profesionalRepo;
    private UsuarioRepository $usuarioRepo;

    // Horarios oficiales de Marian Estilista en Galería La Catedral
    private const HORA_APERTURA = "09:00";
    private const HORA_CIERRE   = "19:00";
    private const INTERVALO_MINUTOS = 30;
    // Días de atención: 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado (0=Domingo, 1=Lunes)
    private const DIAS_LABORALES = [2, 3, 4, 5, 6];

    public function __construct() {
        $this->reservaRepo = new ReservaRepository();
        $this->servicioRepo = new ServicioRepository();
        $this->profesionalRepo = new ProfesionalRepository();
        $this->usuarioRepo = new UsuarioRepository();
    }

    /**
     * Lista reservas según el rol y permisos del usuario autenticado.
     * Si es CLIENTE, solo ve sus propias reservas. Si es ADMIN, ve todas.
     *
     * @param array $usuarioAutenticado
     * @param array $filtros
     * @return array
     */
    public function getReservas(array $usuarioAutenticado, array $filtros = []): array {
        if ($usuarioAutenticado['rol'] === 'ADMIN') {
            $reservas = $this->reservaRepo->getAll($filtros);
        } else {
            $reservas = $this->reservaRepo->getByUsuario((int)$usuarioAutenticado['id']);
        }

        return array_map(fn($r) => $r->toArray(), $reservas);
    }

    /**
     * Obtiene los detalles de una reserva específica validando pertenencia o rol admin.
     *
     * @param int $id
     * @param array $usuarioAutenticado
     * @return array
     * @throws Exception
     */
    public function getById(int $id, array $usuarioAutenticado): array {
        $reserva = $this->reservaRepo->getById($id);
        if (!$reserva) {
            throw new Exception("La reserva solicitada (ID $id) no existe.", 404);
        }

        // Validación de autorización: solo el dueño o un admin pueden consultarla
        if ($usuarioAutenticado['rol'] !== 'ADMIN' && $reserva->usuarioId !== (int)$usuarioAutenticado['id']) {
            throw new Exception("No tiene permisos para ver esta reserva.", 403);
        }

        return $reserva->toArray();
    }

    /**
     * Crea una nueva reserva asegurando validaciones de negocio y evitando colisiones de turno.
     *
     * @param array $data
     * @param array $usuarioAutenticado
     * @return array
     * @throws Exception
     */
    public function createReserva(array $data, array $usuarioAutenticado): array {
        // Regla de seguridad: el usuario siempre es el autenticado, no se permite suplantar a otro cliente
        $usuarioId = (int)$usuarioAutenticado['id'];

        // 1. Validar que el usuario tenga su correo verificado
        $usuario = $this->usuarioRepo->findById($usuarioId);
        if (!$usuario || !$usuario->emailVerificado) {
            throw new Exception("Antes de reservar tenés que verificar tu dirección de correo electrónico.", 403);
        }

        // 2. Validar y normalizar teléfono del cliente
        $telefono = trim($data['telefono'] ?? ($data['cliente']['telefono'] ?? ''));
        $nombre = trim($data['nombre'] ?? ($data['cliente']['nombre'] ?? ''));
        $apellido = trim($data['apellido'] ?? ($data['cliente']['apellido'] ?? ''));

        if (!empty($telefono)) {
            if (!validarTelefono($telefono)) {
                throw new Exception("El número de teléfono ingresado no es válido. Ingresá un número con código de área (por ejemplo: 2920382930 o +54 9 294 455-8899).", 400);
            }
            $telNormalizado = normalizarTelefono($telefono);
            if ($usuario->telefono !== $telNormalizado) {
                $this->usuarioRepo->actualizarTelefono($usuarioId, $telNormalizado);
                $usuario->telefono = $telNormalizado;
            }
        } elseif (empty($usuario->telefono)) {
            throw new Exception("El número de teléfono es obligatorio para confirmar tu turno. Por favor completá tu teléfono de contacto.", 400);
        }

        // Actualizar nombres si se proporcionaron válidos
        if (!empty($nombre) && !empty($apellido)) {
            if (validarNombre($nombre) && validarNombre($apellido)) {
                if ($usuario->nombre !== $nombre || $usuario->apellido !== $apellido) {
                    $this->usuarioRepo->actualizarDatosCliente($usuarioId, $nombre, $apellido, $usuario->telefono ?? '');
                }
            }
        }

        $servicioId = (int)($data['servicio_id'] ?? $data['servicioId'] ?? 0);
        $profesionalId = (int)($data['profesional_id'] ?? $data['profesionalId'] ?? 0);
        $fecha = trim($data['fecha'] ?? '');
        $hora = trim($data['hora'] ?? '');
        $observaciones = trim($data['observaciones'] ?? $data['notas'] ?? '');

        // 3. Validar existencia del servicio
        $servicio = $this->servicioRepo->getById($servicioId);
        if (!$servicio || !$servicio->activo) {
            throw new Exception("El servicio seleccionado no está disponible o no existe.", 400);
        }

        // 4. Validar profesional (si no viene, asignar el titular Mariano)
        $profNombre = 'Mariano';
        if ($profesionalId <= 0) {
            $defaultProf = $this->profesionalRepo->getDefault();
            if (!$defaultProf) {
                throw new Exception("No hay profesional disponible en este momento.", 500);
            }
            $profesionalId = $defaultProf->id;
            $profNombre = $defaultProf->nombre;
        } else {
            $prof = $this->profesionalRepo->getById($profesionalId);
            if (!$prof || !$prof->activo) {
                throw new Exception("El profesional seleccionado no está disponible.", 400);
            }
            $profNombre = $prof->nombre;
        }

        // 5. Validar formato de fecha (YYYY-MM-DD)
        $dtFecha = DateTime::createFromFormat('Y-m-d', $fecha);
        if (!$dtFecha || $dtFecha->format('Y-m-d') !== $fecha) {
            throw new Exception("Formato de fecha inválido. Use AAAA-MM-DD.", 400);
        }

        // Validar que la fecha no esté en el pasado
        $hoy = new DateTime('today');
        if ($dtFecha < $hoy) {
            throw new Exception("No es posible reservar en una fecha que ya ha pasado.", 400);
        }

        // Validar días de apertura: Martes a Sábado (2 a 6)
        $diaSemana = (int)$dtFecha->format('w');
        if (!in_array($diaSemana, self::DIAS_LABORALES, true)) {
            throw new Exception("El salón se encuentra cerrado los días domingos y lunes. Por favor elija de martes a sábado.", 400);
        }

        // 6. Validar horario (formato HH:MM)
        if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $hora)) {
            throw new Exception("Formato de hora inválido. Use HH:MM.", 400);
        }

        $duracionMinutos = $servicio->duracionMinutos;

        // Calcular minutos del día para validar franja de atención (09:00 a 19:00)
        [$startH, $startM] = explode(':', self::HORA_APERTURA);
        [$endH, $endM]     = explode(':', self::HORA_CIERRE);
        [$reqH, $reqM]     = explode(':', $hora);

        $aperturaMin = (int)$startH * 60 + (int)$startM;
        $cierreMin   = (int)$endH * 60 + (int)$endM;
        $solicitadoMin = (int)$reqH * 60 + (int)$reqM;
        $finSolicitadoMin = $solicitadoMin + $duracionMinutos;

        if ($solicitadoMin < $aperturaMin || $finSolicitadoMin > $cierreMin) {
            throw new Exception("El horario seleccionado excede la jornada de atención del salón (09:00 a 19:00 hs).", 400);
        }

        // 7. Verificación de disponibilidad y colisiones en base de datos
        try {
            $colisiones = $this->reservaRepo->findOverlapping($profesionalId, $fecha, $hora, $duracionMinutos);
        } catch (Throwable $e) {
            error_log("[ReservaService] Error en findOverlapping: " . $e->getMessage());
            throw new Exception("No pudimos consultar la disponibilidad en este momento. Por favor intentá nuevamente.", 500);
        }

        if (!empty($colisiones)) {
            throw new Exception("El horario seleccionado ya no se encuentra disponible. Por favor elegí otro horario disponible.", 409);
        }

        // 8. Crear la reserva
        $reserva = new Reserva([
            'usuario_id'       => $usuarioId,
            'profesional_id'   => $profesionalId,
            'servicio_id'      => $servicioId,
            'fecha'            => $fecha,
            'hora'             => $hora . (strlen($hora) === 5 ? ':00' : ''),
            'duracion_minutos' => $duracionMinutos,
            'precio'           => $servicio->precio,
            'estado'           => 'CONFIRMADA',
            'observaciones'    => $observaciones
        ]);

        try {
            $nuevoId = $this->reservaRepo->create($reserva);
            $reservaCreada = $this->reservaRepo->getById($nuevoId);
        } catch (Throwable $e) {
            error_log("[ReservaService] Error en create reserva: " . $e->getMessage());
            throw new Exception("No pudimos completar la reserva. Hubo un problema al guardar tu turno. Verificá los datos e intentá nuevamente.", 500);
        }

        $reservaArray = $reservaCreada ? $reservaCreada->toArray() : ['id' => $nuevoId];
        $reservaArray['servicio'] = [
            'nombre'           => $servicio->nombre,
            'precio'           => $servicio->precio,
            'precio_texto'     => $servicio->precioTexto ?? ('$' . number_format($servicio->precio, 0, ',', '.')),
            'duracion_minutos' => $duracionMinutos
        ];
        $reservaArray['profesional'] = [
            'nombre' => $profNombre ?? 'Mariano'
        ];
        $reservaArray['cliente'] = [
            'nombre'   => $usuario->nombre,
            'apellido' => $usuario->apellido,
            'email'    => $usuario->email,
            'telefono' => $usuario->telefono
        ];

        // 9. Generar comprobante PDF del turno y despachar notificaciones por correo
        try {
            require_once __DIR__ . '/PdfTicketService.php';
            require_once __DIR__ . '/MailerService.php';

            $pdfContent = PdfTicketService::generarTicketPdf($reservaArray);

            // Enviar notificación oficial a Marian con ticket PDF adjunto
            $marianResult = MailerService::enviarNotificacionTurnoMarian($reservaArray, $pdfContent);
            if (!$marianResult['success']) {
                error_log("[ReservaService] Notificación a Marian no enviada: " . ($marianResult['error'] ?? 'desconocido'));
            }

            // Enviar confirmación al cliente con ticket PDF adjunto
            $clienteResult = MailerService::enviarConfirmacionTurnoCliente($reservaArray, $pdfContent);
            if (!$clienteResult['success']) {
                error_log("[ReservaService] Confirmación al cliente no enviada: " . ($clienteResult['error'] ?? 'desconocido'));
            }
        } catch (Throwable $ePdfMail) {
            error_log("[ReservaService EXCEPTION PDF/MAIL] " . $ePdfMail->getMessage());
        }

        return $reservaArray;
    }

    /**
     * Modifica el estado de una reserva (o cancela si es cliente propio).
     *
     * @param int $id
     * @param string $nuevoEstado
     * @param array $usuarioAutenticado
     * @return array
     * @throws Exception
     */
    public function updateEstado(int $id, string $nuevoEstado, array $usuarioAutenticado): array {
        $reserva = $this->reservaRepo->getById($id);
        if (!$reserva) {
            throw new Exception("La reserva con ID $id no existe.", 404);
        }

        // Normalizar estados: el frontend puede enviar variantes como "Confirmado", "Cancelado",
        // "Completado", "Pendiente". Las mapeamos a los valores ENUM exactos de MySQL.
        $mapaEstados = [
            // Valores del ENUM (ya correctos)
            'PENDIENTE'  => 'PENDIENTE',
            'CONFIRMADA' => 'CONFIRMADA',
            'CANCELADA'  => 'CANCELADA',
            'COMPLETADA' => 'COMPLETADA',
            // Variantes PascalCase del frontend
            'PENDIENTE'   => 'PENDIENTE',
            'CONFIRMADO'  => 'CONFIRMADA',  // "Confirmado" → strtoupper → "CONFIRMADO" → mapea a CONFIRMADA
            'CANCELADO'   => 'CANCELADA',   // "Cancelado"  → strtoupper → "CANCELADO"  → mapea a CANCELADA
            'COMPLETADO'  => 'COMPLETADA',  // "Completado" → strtoupper → "COMPLETADO" → mapea a COMPLETADA
            // Inglés (por compatibilidad)
            'CONFIRMED'   => 'CONFIRMADA',
            'CANCELLED'   => 'CANCELADA',
            'CANCELED'    => 'CANCELADA',
            'COMPLETED'   => 'COMPLETADA',
        ];

        $nuevoEstado = strtoupper(trim($nuevoEstado));
        $nuevoEstado = $mapaEstados[$nuevoEstado] ?? $nuevoEstado;

        $estadosValidos = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'];
        if (!in_array($nuevoEstado, $estadosValidos, true)) {
            throw new Exception("Estado inválido '$nuevoEstado'. Opciones: " . implode(', ', $estadosValidos), 400);
        }

        // Regla de autorización:
        // Si no es ADMIN, solo puede pasar su propia reserva a 'CANCELADA'
        if ($usuarioAutenticado['rol'] !== 'ADMIN') {
            if ($reserva->usuarioId !== (int)$usuarioAutenticado['id']) {
                throw new Exception("No tiene permisos para modificar esta reserva.", 403);
            }
            if ($nuevoEstado !== 'CANCELADA') {
                throw new Exception("Los clientes únicamente pueden cancelar sus reservas.", 403);
            }
        }

        $this->reservaRepo->updateEstado($id, $nuevoEstado);
        $actualizado = $this->reservaRepo->getById($id);

        return $actualizado->toArray();
    }

    /**
     * Calcula los intervalos de horarios disponibles en una fecha dada para un profesional.
     *
     * @param int $profesionalId
     * @param string $fecha
     * @param int $duracionMinutos
     * @return array
     */
    public function getDisponibilidad(int $profesionalId, string $fecha, int $duracionMinutos = 60): array {
        $dtFecha = DateTime::createFromFormat('Y-m-d', $fecha);
        if (!$dtFecha) {
            return [];
        }

        // Validar si es día laboral
        $diaSemana = (int)$dtFecha->format('w');
        if (!in_array($diaSemana, self::DIAS_LABORALES, true)) {
            return [];
        }

        // Si es fecha pasada, no hay disponibilidad
        $hoy = new DateTime('today');
        if ($dtFecha < $hoy) {
            return [];
        }

        if ($profesionalId <= 0) {
            $defaultProf = $this->profesionalRepo->getDefault();
            $profesionalId = $defaultProf ? $defaultProf->id : 1;
        }

        // Obtener turnos activos de la fecha
        $turnosActivos = $this->reservaRepo->getActivasPorFecha($profesionalId, $fecha);

        // Convertir turnos existentes a rangos [inicioMinutos, finMinutos]
        $ocupados = [];
        foreach ($turnosActivos as $t) {
            [$h, $m] = explode(':', $t['hora']);
            $inicio = (int)$h * 60 + (int)$m;
            $fin = $inicio + (int)$t['duracion_minutos'];
            $ocupados[] = ['inicio' => $inicio, 'fin' => $fin];
        }

        [$startH, $startM] = explode(':', self::HORA_APERTURA);
        [$endH, $endM]     = explode(':', self::HORA_CIERRE);

        $startTotal = (int)$startH * 60 + (int)$startM;
        $endTotal   = (int)$endH * 60 + (int)$endM;

        $slots = [];
        for ($current = $startTotal; $current + $duracionMinutos <= $endTotal; $current += self::INTERVALO_MINUTOS) {
            $slotInicio = $current;
            $slotFin    = $current + $duracionMinutos;

            $hh = str_pad((string)floor($slotInicio / 60), 2, '0', STR_PAD_LEFT);
            $mm = str_pad((string)($slotInicio % 60), 2, '0', STR_PAD_LEFT);
            $horaStr = "$hh:$mm";

            // Verificar si colisiona con algún turno activo existente
            $colisiona = false;
            foreach ($ocupados as $o) {
                if ($slotInicio < $o['fin'] && $slotFin > $o['inicio']) {
                    $colisiona = true;
                    break;
                }
            }

            $slots[] = [
                'hora'       => $horaStr,
                'disponible' => !$colisiona
            ];
        }

        return $slots;
    }
}
