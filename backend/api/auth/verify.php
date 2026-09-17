<?php
/**
 * verify.php - Endpoint de Verificación de Email
 * Marian Estilista - Backend
 */

require_once __DIR__ . '/../../controllers/AuthController.php';

(new AuthController())->verify();
