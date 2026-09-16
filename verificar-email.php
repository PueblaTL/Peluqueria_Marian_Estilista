<?php
/**
 * verificar-email.php - Página Pública de Verificación de Correo Electrónico
 * Marian Estilista - Sistema de Gestión y Reservas Online
 */

require_once __DIR__ . '/backend/config/config.php';
require_once __DIR__ . '/backend/config/helpers.php';
require_once __DIR__ . '/backend/services/AuthService.php';

$token = trim($_GET['token'] ?? '');
$estado = 'initial'; // 'success', 'expired', 'invalid', 'no_token'
$mensaje = '';
$usuarioData = null;

if (!empty($token)) {
    $authService = new AuthService();
    try {
        $resultado = $authService->verifyEmail($token);
        $estado = 'success';
        $usuarioData = $resultado['usuario'] ?? null;
        $mensaje = 'Tu cuenta fue activada exitosamente. Ya podés iniciar sesión y reservar tus turnos exclusivos.';
    } catch (Exception $e) {
        if ($e->getCode() === 410) {
            $estado = 'expired';
            $mensaje = 'El enlace de verificación expiró. Solicitá un nuevo correo de verificación a continuación.';
        } else {
            $estado = 'invalid';
            $mensaje = 'El enlace de verificación no es válido o ya fue utilizado anteriormente.';
        }
    }
} else {
    $estado = 'no_token';
    $mensaje = 'Ingresá tu correo electrónico para solicitar un nuevo enlace de activación.';
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificación de Correo | Marian Estilista</title>
  <meta name="description" content="Activa tu cuenta en Marian Estilista para reservar citas de peluquería en Bariloche.">
  
  <!-- Favicon -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23C5A880'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z'/></svg>">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="frontend/css/styles.css">
  <link rel="stylesheet" href="frontend/css/auth.css">
  <link rel="stylesheet" href="frontend/css/alerts.css">

  <style>
    .verify-box {
      max-width: 520px;
      margin: 40px auto;
      background: var(--color-black-soft, #21140E);
      border: 1px solid var(--color-gray-dark, #5C4B43);
      border-radius: 12px;
      padding: 40px 30px;
      text-align: center;
      box-shadow: 0 16px 36px rgba(0,0,0,0.5);
    }
    .verify-badge-icon {
      width: 68px;
      height: 68px;
      line-height: 68px;
      font-size: 32px;
      border-radius: 50%;
      margin: 0 auto 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .badge-success {
      background: rgba(39, 174, 96, 0.15);
      color: #27ae60;
      border: 2px solid #27ae60;
    }
    .badge-warning {
      background: rgba(217, 140, 22, 0.15);
      color: #D98C16;
      border: 2px solid #D98C16;
    }
    .verify-title {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      color: #FCF9F5;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .verify-desc {
      font-size: 15px;
      color: #D1C7C0;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .resend-box {
      margin-top: 25px;
      padding-top: 25px;
      border-top: 1px solid #362218;
      text-align: left;
    }
    .resend-box label {
      display: block;
      font-size: 13px;
      color: #D1C7C0;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .resend-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .resend-row input {
      flex: 1;
      min-width: 220px;
    }
  </style>
</head>
<body class="auth-page-body">

  <!-- Header -->
  <header class="site-header scrolled">
    <div class="container header-container">
      <a href="frontend/index.html" class="brand-logo">
        <div class="brand-symbol">M</div>
        <div class="brand-text">
          <span class="brand-name">MARIAN ESTILISTA</span>
          <span class="brand-tag">Peluquería & Colorimetría</span>
        </div>
      </a>

      <div class="header-actions">
        <a href="frontend/index.html" class="btn btn-secondary btn-sm">
          <span>Volver al Inicio</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Contenido -->
  <main class="auth-main-content">
    <div class="verify-box">
      <?php if ($estado === 'success'): ?>
        <div class="verify-badge-icon badge-success">✓</div>
        <h1 class="verify-title">✓ Correo verificado correctamente</h1>
        <p class="verify-desc"><?= htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8') ?></p>
        <a href="frontend/pages/login.html" class="btn btn-primary btn-md" style="width: 100%; display: block; text-decoration: none;">
          <span>Iniciar Sesión</span>
        </a>
      <?php else: ?>
        <div class="verify-badge-icon badge-warning">⚠</div>
        <h1 class="verify-title">
          <?= ($estado === 'expired') ? 'El enlace expiró' : 'Enlace no válido' ?>
        </h1>
        <p class="verify-desc"><?= htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8') ?></p>

        <div class="resend-box">
          <label for="resend-email">Ingresá tu correo para recibir un nuevo enlace:</label>
          <form id="form-resend" onsubmit="handleResendVerification(event)">
            <div class="resend-row">
              <input type="email" id="resend-email" class="form-input-custom" placeholder="tu-email@ejemplo.com" required>
              <button type="submit" id="btn-resend-submit" class="btn btn-primary btn-sm">
                <span>Reenviar correo</span>
              </button>
            </div>
          </form>
          <div id="resend-feedback" style="margin-top: 12px; font-size: 13px; display: none;"></div>
        </div>

        <div style="margin-top: 25px;">
          <a href="frontend/pages/login.html" class="btn btn-secondary btn-sm" style="text-decoration: none;">
            <span>Ir a Iniciar Sesión</span>
          </a>
        </div>
      <?php endif; ?>
    </div>
  </main>

  <!-- Modal de Alerta Global -->
  <div id="marian-alert-backdrop" class="marian-alert-backdrop" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="marian-alert-modal">
      <div id="marian-alert-icon" class="marian-alert-icon warning">⚠</div>
      <h3 id="marian-alert-title" class="marian-alert-title">Alerta</h3>
      <p id="marian-alert-msg" class="marian-alert-msg"></p>
      <div class="marian-alert-actions">
        <button type="button" id="marian-alert-btn" class="marian-btn marian-btn-gold">Entendido</button>
      </div>
    </div>
  </div>

  <script src="frontend/js/alerts.js"></script>
  <script>
    async function handleResendVerification(e) {
      e.preventDefault();
      const emailInput = document.getElementById("resend-email");
      const btn = document.getElementById("btn-resend-submit");
      const feedback = document.getElementById("resend-feedback");
      const email = emailInput?.value.trim();

      if (!email) return;

      btn.disabled = true;
      btn.textContent = "Enviando...";
      feedback.style.display = "none";

      try {
        const res = await fetch("backend/api/auth/resend-verification.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          feedback.style.display = "block";
          feedback.style.color = "#27ae60";
          feedback.textContent = "✓ " + data.message;
          if (window.showAlertModal) {
            window.showAlertModal({
              title: "Correo Reenviado",
              message: data.message,
              type: "success"
            });
          }
        } else {
          feedback.style.display = "block";
          feedback.style.color = "#e74c3c";
          feedback.textContent = data.message || "No se pudo reenviar el correo.";
          if (window.showAlertModal) {
            window.showAlertModal({
              title: "Atención",
              message: data.message || "No se pudo reenviar el correo.",
              type: "warning"
            });
          }
        }
      } catch (err) {
        feedback.style.display = "block";
        feedback.style.color = "#e74c3c";
        feedback.textContent = "Error al conectar con el servidor.";
      } finally {
        btn.disabled = false;
        btn.textContent = "Reenviar correo";
      }
    }
  </script>
</body>
</html>
