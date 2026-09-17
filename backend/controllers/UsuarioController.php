<?php
/**
 * UsuarioController.php - Controlador para Gestión de Usuarios
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../repositories/UsuarioRepository.php';

class UsuarioController {
    private UsuarioRepository $usuarioRepo;

    public function __construct() {
        $this->usuarioRepo = new UsuarioRepository();
    }

    /**
     * Lista todos los usuarios (requiere rol ADMIN).
     */
    public function listAll(): void {
        requireAdmin();

        try {
            $usuarios = $this->usuarioRepo->listAll();
            $data = array_map(fn($u) => $u->toSafeArray(), $usuarios);
            jsonResponse(true, "Listado de usuarios obtenido correctamente.", $data, 200);
        } catch (Exception $e) {
            jsonResponse(false, "Error al obtener usuarios.", null, 500, 'USERS_FETCH_ERROR');
        }
    }

    /**
     * Lista clientes con estadísticas de reservas (requiere rol ADMIN).
     * Datos: nombre, apellido, email, telefono, cantidadTurnos, ultimoTurno, gastoTotal.
     */
    public function listClientes(): void {
        requireAdmin();

        try {
            $clientes = $this->usuarioRepo->listClientes();
            jsonResponse(true, "Listado de clientes obtenido correctamente.", $clientes, 200);
        } catch (Exception $e) {
            jsonResponse(false, "Error al obtener clientes: " . $e->getMessage(), null, 500, 'CLIENTES_FETCH_ERROR');
        }
    }
}
