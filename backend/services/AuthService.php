<?php
/**
 * AuthService.php - Servicio de Lógica de Negocio de Autenticación y Cuentas
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../repositories/UsuarioRepository.php';
require_once __DIR__ . '/MailerService.php';

class AuthException extends Exception {
    private string $errorType;
    public function __construct(string $message, int $code = 401, string $errorType = 'auth') {
        parent::__construct($message, $code);
        $this->errorType = $errorType;
    }
    public function getErrorType(): string {
        return $this->errorType;
    }
}

class AuthService {
    private UsuarioRepository $usuarioRepo;

    public function __construct() {
        $this->usuarioRepo = new UsuarioRepository();
    }

    /**
     * Registra un nuevo usuario en la plataforma con verificación de correo electrónico.
     * Siempre fuerza el rol 'CLIENTE' por seguridad.
     *
     * @param array $data
     * @return array Datos del usuario creado y estado de verificación
     * @throws Exception Si hay datos inválidos o el email ya existe
     */
    public function register(array $data): array {
        $nombre = trim($data['nombre'] ?? '');
        $apellido = trim($data['apellido'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $confirmPassword = $data['confirm_password'] ?? $data['confirmPassword'] ?? $password;
        $telefono = trim($data['telefono'] ?? '');

        // 1. Validar nombre y apellido (soporte completo de caracteres españoles: tildes, diéresis, ñ)
        if (empty($nombre) || !validarNombre($nombre)) {
            throw new Exception("El nombre ingresado no es válido. Revisá que contenga entre 2 y 60 letras válidas.", 400);
        }

        if (empty($apellido) || !validarNombre($apellido)) {
            throw new Exception("El apellido ingresado no es válido. Revisá que contenga entre 2 y 60 letras válidas.", 400);
        }

        // 2. Validar email
        if (!validarEmail($email)) {
            throw new Exception("El correo electrónico ingresado no tiene un formato válido.", 400);
        }

        // 3. Validar teléfono flexible
        if (empty($telefono) || !validarTelefono($telefono)) {
            throw new Exception("El número de teléfono ingresado no es válido. Ingresá un número con código de área (por ejemplo: 2920382930 o +54 9 294 455-8899).", 400);
        }

        // Normalizar teléfono para guardarlo homogéneamente en MySQL
        $telefonoNormalizado = normalizarTelefono($telefono);

        // 4. Validar contraseña
        if (strlen($password) < 6) {
            throw new Exception("La contraseña debe tener al menos 6 caracteres.", 400);
        }

        if ($password !== $confirmPassword) {
            throw new Exception("Las contraseñas ingresadas no coinciden.", 400);
        }

        // 5. Verificar si el correo ya está registrado
        $existente = $this->usuarioRepo->findByEmail($email);
        if ($existente !== null) {
            throw new Exception("Ya existe una cuenta registrada con el correo '$email'. Si es tu cuenta, iniciá sesión.", 409);
        }

        // 6. Hashear la contraseña de forma segura con BCRYPT
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // 7. Generar token criptográficamente seguro para verificación de correo (24 horas)
        $tokenVerificacion = bin2hex(random_bytes(32));
        $tokenExpiracion = date('Y-m-d H:i:s', strtotime('+24 hours'));
        $ahora = date('Y-m-d H:i:s');

        // 8. Crear la entidad Usuario forzando rol CLIENTE y email_verificado = FALSE
        $usuario = new Usuario([
            'nombre'                => $nombre,
            'apellido'              => $apellido,
            'email'                 => $email,
            'password'              => $passwordHash,
            'telefono'              => $telefonoNormalizado,
            'rol'                   => 'CLIENTE',
            'email_verificado'      => 0,
            'token_verificacion'    => $tokenVerificacion,
            'token_expiracion'      => $tokenExpiracion,
            'ultimo_reenvio_correo' => $ahora,
            'activo'                => 1
        ]);

        $nuevoId = $this->usuarioRepo->create($usuario);
        $usuario->id = $nuevoId;

        // 9. Enviar correo de verificación
        $mailResult = MailerService::enviarCorreoVerificacion($email, $nombre, $tokenVerificacion);
        if (empty($mailResult['success'])) {
            error_log("[AuthService] Falló el envío del correo de verificación para el usuario ID {$nuevoId} ($email).");
            throw new Exception("Tu cuenta fue registrada, pero no pudimos enviar el correo de activación debido a un inconveniente temporal con el servidor de correo. Por favor solicitá el reenvío de activación.", 502);
        }

        // NO iniciamos sesión automáticamente: la cuenta requiere verificación
        return [
            'usuario'              => $usuario->toSafeArray(),
            'requiereVerificacion' => true,
            'email'                => $email,
            'debugVerificationUrl' => (defined('DEBUG_MODE') && DEBUG_MODE) ? ($mailResult['url'] ?? null) : null
        ];
    }

    /**
     * Autentica a un usuario mediante email y contraseña.
     * Verifica que la cuenta posea su email verificado.
     *
     * @param string $email
     * @param string $password
     * @return array Datos del usuario autenticado
     * @throws Exception Si las credenciales son incorrectas o el email no fue verificado
     */
    public function login(string $email, string $password): array {
        $email = strtolower(trim($email));

        if (empty($email) || empty($password)) {
            throw new AuthException("Ingresá tu correo electrónico y contraseña para continuar.", 400, "validation");
        }

        $usuario = $this->usuarioRepo->findByEmail($email);

        if (!$usuario) {
            throw new AuthException("No existe una cuenta registrada con ese correo electrónico.", 401, "user_not_found");
        }

        if (!$usuario->activo) {
            throw new AuthException("Esta cuenta se encuentra desactivada.", 401, "account_disabled");
        }

        // Verificación segura mediante password_verify()
        if (!password_verify($password, $usuario->password)) {
            throw new AuthException("La contraseña ingresada no es correcta.", 401, "invalid_password");
        }

        // Comprobación de verificación de email
        if (!$usuario->emailVerificado) {
            throw new AuthException("Debés verificar tu correo electrónico antes de iniciar sesión.", 403, "email_not_verified");
        }

        // Establecer sesión segura
        $_SESSION['usuario'] = $usuario->toSafeArray();

        return $usuario->toSafeArray();
    }

    /**
     * Valida un token de verificación y activa la cuenta del usuario.
     *
     * @param string $token
     * @return array
     * @throws Exception
     */
    public function verifyEmail(string $token): array {
        $token = trim($token);
        if (empty($token)) {
            throw new Exception("Token de verificación no proporcionado.", 400);
        }

        $usuario = $this->usuarioRepo->findByToken($token);
        if (!$usuario) {
            throw new Exception("El enlace de verificación no es válido o ya fue utilizado previamente.", 404);
        }

        // Validar expiración del token
        if ($usuario->tokenExpiracion && strtotime($usuario->tokenExpiracion) < time()) {
            throw new Exception("El enlace de verificación expiró. Solicitá un nuevo correo de verificación.", 410);
        }

        // Marcar como verificado y anular el token
        $this->usuarioRepo->marcarEmailVerificado($usuario->id);
        $usuario->emailVerificado = true;

        return [
            'success' => true,
            'usuario' => $usuario->toSafeArray()
        ];
    }

    /**
     * Reenvía un nuevo correo de verificación con protección anti-spam.
     *
     * @param string $email
     * @return array
     * @throws Exception
     */
    public function resendVerification(string $email): array {
        $email = strtolower(trim($email));
        if (!validarEmail($email)) {
            throw new Exception("El correo electrónico ingresado no es válido.", 400);
        }

        $usuario = $this->usuarioRepo->findByEmail($email);
        if (!$usuario) {
            // Por seguridad ante enumeración de usuarios, devolver mensaje neutral positivo
            return [
                'success' => true,
                'message' => "Si la dirección '$email' está registrada, te enviamos un nuevo enlace de activación."
            ];
        }

        if ($usuario->emailVerificado) {
            return [
                'success' => true,
                'alreadyVerified' => true,
                'message' => "Esta cuenta ya se encuentra verificada. Podés iniciar sesión normalmente."
            ];
        }

        // Control anti-spam: esperar al menos 120 segundos (2 minutos) entre solicitudes
        if (!empty($usuario->ultimoReenvioCorreo)) {
            $segundosDesdeUltimo = time() - strtotime($usuario->ultimoReenvioCorreo);
            $tiempoMinimo = 120;
            if ($segundosDesdeUltimo < $tiempoMinimo) {
                $restantes = $tiempoMinimo - $segundosDesdeUltimo;
                throw new Exception("Por favor esperá {$restantes} segundos antes de solicitar un nuevo reenvío.", 429);
            }
        }

        // Generar nuevo token
        $nuevoToken = bin2hex(random_bytes(32));
        $nuevaExpiracion = date('Y-m-d H:i:s', strtotime('+24 hours'));
        $this->usuarioRepo->actualizarTokenVerificacion($usuario->id, $nuevoToken, $nuevaExpiracion);

        // Enviar nuevo correo
        $mailResult = MailerService::enviarCorreoVerificacion($email, $usuario->nombre, $nuevoToken);
        if (empty($mailResult['success'])) {
            error_log("[AuthService] Falló el reenvío del correo de verificación para el usuario ID {$usuario->id} ($email).");
            throw new Exception("No pudimos enviar el correo de verificación en este momento. Por favor intentá nuevamente en unos minutos.", 502);
        }

        return [
            'success' => true,
            'message' => "Te enviamos un nuevo enlace de verificación a tu correo electrónico."
        ];
    }

    /**
     * Cierra la sesión activa del usuario.
     */
    public function logout(): void {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }
        session_destroy();
    }

    /**
     * Retorna el usuario actualmente autenticado o null si no hay sesión.
     *
     * @return array|null
     */
    public function getCurrentUser(): ?array {
        return $_SESSION['usuario'] ?? null;
    }

    /**
     * Inicia el proceso de recuperación de contraseña.
     * Genera un token seguro y envía un correo con el enlace de restablecimiento.
     * Por seguridad no revela si el email existe o no (mensaje neutro).
     *
     * @param string $email
     * @return array
     * @throws Exception
     */
    public function forgotPassword(string $email): array {
        $email = strtolower(trim($email));
        $genericResponse = [
            'success' => true,
            'message' => "Si el correo está registrado, recibirás un enlace para recuperar tu contraseña."
        ];

        if (empty($email) || !validarEmail($email)) {
            // Aún con email no válido se devuelve respuesta genérica para evitar timing attacks o validación previa
            return $genericResponse;
        }

        $usuario = $this->usuarioRepo->findByEmail($email);
        if (!$usuario || !$usuario->activo) {
            // Usuario inexistente o inactivo: responder neutralmente sin revelar datos
            return $genericResponse;
        }

        // Control anti-abuso / rate limiting: máximo 1 solicitud cada 2 minutos
        $solicitudesRecientes = $this->usuarioRepo->contarSolicitudesRecuperacionRecientes($usuario->id, 2);
        if ($solicitudesRecientes > 0) {
            // Si ya se solicitó recientemente, responder neutralmente sin reenviar spam
            return $genericResponse;
        }

        // Generar token criptográficamente seguro (256 bits)
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expiracion = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;

        // Guardar token en base de datos
        $this->usuarioRepo->crearTokenRecuperacion($usuario->id, $tokenHash, $expiracion, $ip);

        // Enviar correo de recuperación
        $mailResult = MailerService::enviarCorreoRecuperacion($email, $usuario->nombre, $token);
        if (empty($mailResult['success'])) {
            error_log("[AuthService] Falló el envío del correo de recuperación para el usuario ID {$usuario->id} ($email).");
        }

        return $genericResponse;
    }

    /**
     * Valida si un token de recuperación existe, está vigente y no ha sido utilizado.
     *
     * @param string $token
     * @return array
     * @throws Exception
     */
    public function validateResetToken(string $token): array {
        $token = trim($token);
        if (empty($token) || strlen($token) !== 64) {
            throw new Exception("El enlace de recuperación no es válido.", 400);
        }

        $tokenHash = hash('sha256', $token);
        $resetRow = $this->usuarioRepo->buscarTokenRecuperacionValido($tokenHash);

        if (!$resetRow) {
            throw new Exception("El enlace de recuperación no es válido, ha vencido o ya fue utilizado.", 400);
        }

        return [
            'valid'  => true,
            'nombre' => $resetRow['nombre'] ?? 'Clienta'
        ];
    }

    /**
     * Actualiza la contraseña del usuario utilizando un token de recuperación válido.
     * Invalida inmediatamente el token tras su uso.
     *
     * @param string $token
     * @param string $newPassword
     * @param string $confirmPassword
     * @return array
     * @throws Exception
     */
    public function resetPassword(string $token, string $newPassword, string $confirmPassword): array {
        $token = trim($token);
        if (empty($token) || strlen($token) !== 64) {
            throw new Exception("El enlace de recuperación no es válido.", 400);
        }

        if (strlen($newPassword) < 6) {
            throw new Exception("La nueva contraseña debe tener al menos 6 caracteres.", 400);
        }

        if ($newPassword !== $confirmPassword) {
            throw new Exception("Las contraseñas no coinciden. Verificá que ambas sean iguales.", 400);
        }

        $tokenHash = hash('sha256', $token);
        $resetRow = $this->usuarioRepo->buscarTokenRecuperacionValido($tokenHash);

        if (!$resetRow) {
            throw new Exception("El enlace de recuperación no es válido, ha vencido o ya fue utilizado.", 400);
        }

        $userId = (int)$resetRow['usuario_id'];
        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

        // Actualizar contraseña
        $this->usuarioRepo->actualizarPassword($userId, $passwordHash);

        // Invalidar inmediatamente el token
        $this->usuarioRepo->marcarTokenRecuperacionUtilizado((int)$resetRow['id']);

        return [
            'success' => true,
            'message' => "Tu contraseña fue actualizada correctamente. Ya podés iniciar sesión."
        ];
    }
}

