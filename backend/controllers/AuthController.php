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

    public function register(): void {
        try {
            $data = getRequestData();
            $usuario = $this->authService->register($data);
            jsonResponse(true, "Usuario registrado e iniciado sesión exitosamente.", $usuario, 201);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            jsonResponse(false, $e->getMessage(), null, $code, 'REGISTER_FAILED');
        }
    }

    public function login(): void {
        try {
            $data = getRequestData();
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';

            $usuario = $this->authService->login($email, $password);
            jsonResponse(true, "Inicio de sesión exitoso.", $usuario, 200);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 401;
            jsonResponse(false, $e->getMessage(), null, $code, 'LOGIN_FAILED');
        }
    }

    public function logout(): void {
        try {
            $this->authService->logout();
            jsonResponse(true, "Sesión cerrada correctamente.", null, 200);
        } catch (Exception $e) {
            jsonResponse(false, "Error al cerrar sesión.", null, 500, 'LOGOUT_FAILED');
        }
    }

    public function me(): void {
        $usuario = $this->authService->getCurrentUser();
        if ($usuario) {
            jsonResponse(true, "Sesión activa.", $usuario, 200);
        } else {
            jsonResponse(false, "No hay sesión activa.", null, 401, 'UNAUTHENTICATED');
        }
    }
}
