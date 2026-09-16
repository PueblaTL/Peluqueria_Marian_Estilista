<?php
/**
 * MailerService.php - Servicio de Envío de Correos Electrónicos con Estética Marian Estilista
 * Soporta correo de verificación de cuenta y notificaciones.
 */

class MailerService {
    /**
     * Envía el correo de verificación de cuenta con token único y botón de acción.
     *
     * @param string $email
     * @param string $nombre
     * @param string $token
     * @return array ['success' => bool, 'url' => string, 'error' => string|null]
     */
    public static function enviarCorreoVerificacion(string $email, string $nombre, string $token): array {
        $verificationUrl = self::generarUrlVerificacion($token);

        $asunto = "Confirmá tu correo electrónico — Marian Estilista";

        $htmlBody = self::construirPlantillaVerificacion($nombre, $verificationUrl);
        $textBody = "MARIAN ESTILISTA\nPeluquería & Colorimetría\n\nConfirmá tu correo electrónico\n\n¡Hola {$nombre}!\nGracias por registrarte.\nPara activar tu cuenta, hacé clic en el siguiente enlace:\n\n{$verificationUrl}\n\nEste enlace es válido durante 24 horas.\nSi no realizaste este registro, podés ignorar este correo.\n\nMarian Estilista — Galería La Catedral, San Carlos de Bariloche";

        $fromAddress = defined('MAIL_FROM_ADDRESS') ? MAIL_FROM_ADDRESS : 'jesusechavarria@marianestilista.online';
        $fromName    = defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'Marian Estilista';

        // Cabeceras MIME para HTML en UTF-8
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . $fromName . ' <' . $fromAddress . '>',
            'Reply-To: ' . $fromName . ' <' . $fromAddress . '>',
            'X-Mailer: PHP/' . phpversion()
        ];

        $enviado = false;
        $errorMsg = null;

        try {
            // Intentar envío con función nativa mail() de PHP
            $enviado = @mail($email, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $htmlBody, implode("\r\n", $headers));
        } catch (Throwable $e) {
            $errorMsg = $e->getMessage();
        }

        // Registrar en logs para depuración y soporte (indispensable en desarrollo local sin SMTP)
        error_log("[MailerService] Correo de verificación para <$email> desde <$fromAddress>. Link: $verificationUrl (Enviado: " . ($enviado ? 'SI' : 'NO/Local') . ")");

        return [
            'success' => true, // En desarrollo local permitimos continuar aunque mail() local no tenga relay
            'url'     => $verificationUrl,
            'sent'    => $enviado,
            'error'   => $errorMsg
        ];
    }

    /**
     * Construye la URL completa del enlace de verificación.
     *
     * @param string $token
     * @return string
     */
    public static function generarUrlVerificacion(string $token): string {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
            ? 'https://'
            : 'http://';

        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        
        // Determinar ruta base del script
        $scriptPath = $_SERVER['SCRIPT_NAME'] ?? '';
        $dir = dirname($scriptPath);
        
        // Detectar si estamos bajo un subdirectorio como /marian-estilista o /peluqueria-portal
        if (preg_match('#^(.*?/(marian-estilista|peluqueria-portal))#i', $scriptPath, $m)) {
            $basePath = $m[1];
        } else {
            $basePath = '';
        }

        return rtrim($protocol . $host . $basePath, '/') . '/verificar-email.php?token=' . urlencode($token);
    }

    /**
     * Genera la plantilla HTML con el diseño premium de Marian Estilista:
     * Negro profundo, acentos dorados, tipografía cuidada y botón accesible.
     *
     * @param string $nombre
     * @param string $url
     * @return string
     */
    private static function construirPlantillaVerificacion(string $nombre, string $url): string {
        $nombreEscapado = htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8');
        $urlEscapada = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificá tu Correo — Marian Estilista</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #120A07;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #FCF9F5;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #120A07;
      padding: 40px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #21140E;
      border: 1px solid #5C4B43;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header {
      background: #120A07;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 1px solid #362218;
    }
    .brand-symbol {
      display: inline-block;
      width: 44px;
      height: 44px;
      line-height: 44px;
      background: #B36B00;
      color: #FCF9F5;
      font-size: 22px;
      font-weight: bold;
      border-radius: 50%;
      margin-bottom: 10px;
    }
    .brand-title {
      margin: 0;
      font-size: 20px;
      letter-spacing: 2px;
      color: #FCF9F5;
      text-transform: uppercase;
    }
    .brand-sub {
      margin-top: 4px;
      font-size: 11px;
      letter-spacing: 3px;
      color: #D98C16;
      text-transform: uppercase;
    }
    .content {
      padding: 35px 30px;
      text-align: center;
      line-height: 1.6;
    }
    .greeting {
      font-size: 22px;
      color: #FCF9F5;
      margin-top: 0;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .message {
      font-size: 15px;
      color: #D1C7C0;
      margin-bottom: 30px;
    }
    .btn-verify {
      display: inline-block;
      background: #B36B00;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 16px 36px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-radius: 6px;
      box-shadow: 0 4px 15px rgba(179, 107, 0, 0.4);
    }
    .btn-verify:hover {
      background: #D98C16;
    }
    .alt-link {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #362218;
      font-size: 12px;
      color: #8A7C73;
      word-break: break-all;
    }
    .alt-link a {
      color: #D98C16;
      text-decoration: underline;
    }
    .footer {
      background: #120A07;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #8A7C73;
      border-top: 1px solid #362218;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-symbol">M</div>
        <h1 class="brand-title">MARIAN ESTILISTA</h1>
        <div class="brand-sub">Peluquería & Colorimetría</div>
      </div>
      <div class="content">
        <h2 class="greeting">Confirmá tu correo electrónico</h2>
        <p class="message" style="margin-bottom: 12px;">
          ¡Hola, {$nombreEscapado}! Gracias por registrarte.
        </p>
        <p class="message">
          Para activar tu cuenta, hacé clic en el siguiente botón.
        </p>
        <div style="margin: 30px 0;">
          <a href="{$urlEscapada}" target="_blank" class="btn-verify">VERIFICAR MI CORREO</a>
        </div>
        <p style="font-size: 13.5px; color: #D1C7C0; margin-top: 24px; line-height: 1.5;">
          Este enlace es válido durante 24 horas.
        </p>
        <p style="font-size: 12.5px; color: #8A7C73; margin-top: 8px;">
          Si no realizaste este registro, podés ignorar este correo.
        </p>
        <div class="alt-link">
          Si el botón no funciona, copiá y pegá el siguiente enlace en tu navegador:<br>
          <a href="{$urlEscapada}">{$urlEscapada}</a>
        </div>
      </div>
      <div class="footer">
        Galería La Catedral, San Carlos de Bariloche<br>
        &copy; Marian Estilista. Todos los derechos reservados.
      </div>
    </div>
  </div>
</body>
</html>
HTML;
    }
}
