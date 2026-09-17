<?php
/**
 * resend-verification.php - Endpoint de Reenvío de Correo de Verificación
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../../controllers/AuthController.php';

(new AuthController())->resendVerification();
