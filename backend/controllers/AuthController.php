<?php
/**
 * AuthController.php - Controlador de Autenticación
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../services/AuthService.php';

class AuthController {
    private AuthService $authService;

    public function __construct() {
        $this->authService = new AuthService();
    }

    /**
     * Registra un nuevo usuario y despacha el correo de activación.
     */
    public function register(): void {
        try {
            $data = getRequestData();
            $resultado = $this->authService->register($data);
            jsonResponse(
                true,
                "Cuenta creada correctamente. Te enviamos un correo para verificar tu dirección.",
                $resultado,
                201,
                null,
                'success'
            );
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            $type = ($code === 409) ? 'conflict' : 'validation';
            jsonResponse(false, $e->getMessage(), null, $code, 'REGISTER_FAILED', $type);
        }
    }

    /**
     * Inicio de sesión. Valida credenciales y estado de verificación de correo.
     */
    public function login(): void {
        try {
            $data = getRequestData();
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';

            $usuario = $this->authService->login($email, $password);
            jsonResponse(true, "Inicio de sesión exitoso.", $usuario, 200, null, 'success');
        } catch (AuthException $e) {
            jsonResponse(false, $e->getMessage(), null, $e->getCode(), null, $e->getErrorType());
        } catch (Exception $e) {
            error_log("[AuthController login] " . $e->getMessage());
            jsonResponse(false, "No pudimos iniciar sesión. Intentá nuevamente.", null, 500, null, 'server_error');
        }
    }

    /**
     * Valida el token de verificación recibido vía GET o POST.
     */
    public function verify(): void {
        try {
            $token = $_GET['token'] ?? $_POST['token'] ?? '';
            if (empty($token)) {
                $data = getRequestData();
                $token = $data['token'] ?? '';
            }

            $res = $this->authService->verifyEmail($token);
            jsonResponse(true, "Correo verificado correctamente. Tu cuenta fue activada. Ya podés iniciar sesión.", $res, 200, null, 'success');
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'VERIFY_FAILED', 'validation');
        }
    }

    /**
     * Reenvía el correo de verificación.
     */
    public function resendVerification(): void {
        try {
            $data = getRequestData();
            $email = $data['email'] ?? $_GET['email'] ?? '';

            $res = $this->authService->resendVerification($email);
            jsonResponse(true, $res['message'], $res, 200, null, 'success');
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            $type = ($code === 429) ? 'rate_limit' : 'validation';
            jsonResponse(false, $e->getMessage(), null, $code, 'RESEND_FAILED', $type);
        }
    }

    /**
     * Cierra la sesión activa.
     */
    public function logout(): void {
        try {
            $this->authService->logout();
            jsonResponse(true, "Sesión cerrada correctamente.", null, 200, null, 'success');
        } catch (Exception $e) {
            jsonResponse(false, "Error al cerrar sesión.", null, 500, 'LOGOUT_FAILED', 'server');
        }
    }

    /**
     * Obtiene los datos de la sesión actual.
     */
    public function me(): void {
        $usuario = $this->authService->getCurrentUser();
        if ($usuario) {
            jsonResponse(true, "Sesión activa.", $usuario, 200, null, 'success');
        } else {
            jsonResponse(false, "No hay sesión activa.", null, 401, 'UNAUTHENTICATED', 'auth');
        }
    }
}
