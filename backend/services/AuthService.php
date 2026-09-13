<?php
/**
 * AuthService.php - Servicio de Lógica de Negocio de Autenticación y Cuentas
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../repositories/UsuarioRepository.php';

class AuthService {
    private UsuarioRepository $usuarioRepo;

    public function __construct() {
        $this->usuarioRepo = new UsuarioRepository();
    }

    /**
     * Registra un nuevo usuario en la plataforma.
     * Siempre fuerza el rol 'CLIENTE' por seguridad.
     *
     * @param array $data
     * @return array Datos del usuario creado
     * @throws Exception Si hay datos inválidos o el email ya existe
     */
    public function register(array $data): array {
        $nombre = trim($data['nombre'] ?? '');
        $apellido = trim($data['apellido'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $confirmPassword = $data['confirm_password'] ?? $data['confirmPassword'] ?? $password;
        $telefono = trim($data['telefono'] ?? '');

        if (empty($nombre) || empty($apellido)) {
            throw new Exception("El nombre y el apellido son obligatorios.", 400);
        }

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Debe proporcionar una dirección de correo electrónico válida.", 400);
        }

        if (strlen($password) < 6) {
            throw new Exception("La contraseña debe tener al menos 6 caracteres.", 400);
        }

        if ($password !== $confirmPassword) {
            throw new Exception("Las contraseñas no coinciden.", 400);
        }

        // Verificar si el correo ya está registrado
        $existente = $this->usuarioRepo->findByEmail($email);
        if ($existente !== null) {
            throw new Exception("Ya existe una cuenta registrada con el email '$email'.", 409);
        }

        // Hashear la contraseña con BCRYPT
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // Crear la entidad Usuario forzando rol CLIENTE
        $usuario = new Usuario([
            'nombre'   => $nombre,
            'apellido' => $apellido,
            'email'    => $email,
            'password' => $passwordHash,
            'telefono' => $telefono,
            'rol'      => 'CLIENTE', // Regla de seguridad: nunca permitir inyectar rol ADMIN desde el registro
            'activo'   => 1
        ]);

        $nuevoId = $this->usuarioRepo->create($usuario);
        $usuario->id = $nuevoId;

        // Iniciar sesión automáticamente tras el registro exitoso
        $_SESSION['usuario'] = $usuario->toSafeArray();

        return $usuario->toSafeArray();
    }

    /**
     * Autentica a un usuario mediante email y contraseña.
     *
     * @param string $email
     * @param string $password
     * @return array Datos del usuario autenticado
     * @throws Exception Si las credenciales son incorrectas
     */
    public function login(string $email, string $password): array {
        $email = strtolower(trim($email));

        if (empty($email) || empty($password)) {
            throw new Exception("Debe ingresar su email y contraseña.", 400);
        }

        $usuario = $this->usuarioRepo->findByEmail($email);

        if (!$usuario || !$usuario->activo) {
            throw new Exception("Credenciales incorrectas. Verifique su email y contraseña.", 401);
        }

        // Verificación segura mediante password_verify()
        if (!password_verify($password, $usuario->password)) {
            throw new Exception("Credenciales incorrectas. Verifique su email y contraseña.", 401);
        }

        // Establecer sesión segura
        $_SESSION['usuario'] = $usuario->toSafeArray();

        return $usuario->toSafeArray();
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
}
