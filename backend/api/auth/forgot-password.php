<?php
/**
 * forgot-password.php - Endpoint API para Solicitud de Recuperación de Contraseña
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../../controllers/AuthController.php';

(new AuthController())->forgotPassword();
