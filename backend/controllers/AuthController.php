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
            // Conserva el curso al abrir la verificación de correo en otra pestaña.
            if (($data['return_to'] ?? '') === 'curso') {
                $_SESSION['auth_return_course'] = true;
            } else {
                unset($_SESSION['auth_return_course']);
            }
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
     * Si la petición proviene de un navegador web, redirige directamente al login con el resultado visual.
     */
    public function verify(): void {
        $token = $_GET['token'] ?? $_POST['token'] ?? '';
        if (empty($token)) {
            $data = getRequestData();
            $token = $data['token'] ?? '';
        }

        $isHtmlRequest = !empty($_SERVER['HTTP_ACCEPT']) && 
                         (strpos($_SERVER['HTTP_ACCEPT'], 'text/html') !== false) && 
                         (strpos($_SERVER['HTTP_ACCEPT'], 'application/json') === false);

        $loginUrl = (defined('APP_URL') ? APP_URL : '') . '/frontend/pages/login.html';
        $returnQuery = !empty($_SESSION['auth_return_course']) ? '&redirect=curso.html&action=inscripcion' : '';

        try {
            $res = $this->authService->verifyEmail($token);
            if ($isHtmlRequest) {
                header("Location: " . $loginUrl . "?verified=1" . $returnQuery);
                exit();
            }
            jsonResponse(true, "Correo verificado correctamente. Tu cuenta fue activada. Ya podés iniciar sesión.", $res, 200, null, 'success');
        } catch (Exception $e) {
            $errCode = $e->getCode();
            $errParam = ($errCode === 410) ? 'expired' : 'invalid';
            if ($isHtmlRequest) {
                header("Location: " . $loginUrl . "?verify_error=" . $errParam . $returnQuery);
                exit();
            }
            $code = ($errCode >= 400 && $errCode < 600) ? $errCode : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'VERIFY_FAILED', 'validation');
        }
    }

    /**
     * Procesa la solicitud de recuperación de contraseña ("¿Olvidaste tu contraseña?").
     */
    public function forgotPassword(): void {
        try {
            $data = getRequestData();
            $email = $data['email'] ?? $_POST['email'] ?? '';
            $res = $this->authService->forgotPassword($email);
            jsonResponse(true, $res['message'], $res, 200, null, 'success');
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            jsonResponse(false, "Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.", null, 200, null, 'success');
        }
    }

    /**
     * Valida la vigencia de un token de recuperación.
     */
    public function validateResetToken(): void {
        try {
            $token = $_GET['token'] ?? $_POST['token'] ?? '';
            if (empty($token)) {
                $data = getRequestData();
                $token = $data['token'] ?? '';
            }
            $res = $this->authService->validateResetToken($token);
            jsonResponse(true, "Token válido.", $res, 200, null, 'success');
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'INVALID_TOKEN', 'validation');
        }
    }

    /**
     * Establece la nueva contraseña usando el token de recuperación.
     */
    public function resetPassword(): void {
        try {
            $data = getRequestData();
            $token = $data['token'] ?? $_POST['token'] ?? '';
            $password = $data['password'] ?? $_POST['password'] ?? '';
            $confirmPassword = $data['confirm_password'] ?? $data['confirmPassword'] ?? $_POST['confirm_password'] ?? '';

            $res = $this->authService->resetPassword($token, $password, $confirmPassword);
            jsonResponse(true, $res['message'], $res, 200, null, 'success');
        } catch (Exception $e) {
            $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'RESET_FAILED', 'validation');
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
