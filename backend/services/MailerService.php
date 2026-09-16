<?php
/**
 * MailerService.php - Servicio de Envío de Correos Electrónicos con PHPMailer y SMTP DonWeb/Ferozo
 * Marian Estilista - San Carlos de Bariloche
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../libs/PHPMailer/Exception.php';
require_once __DIR__ . '/../libs/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../libs/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class MailerService {

    /**
     * Instancia y configura el cliente PHPMailer con el servidor SMTP seguro de DonWeb/Ferozo.
     *
     * @return PHPMailer
     */
    public static function createMailer(): PHPMailer {
        $mail = new PHPMailer(true);

        // Configuración oficial SMTP DonWeb/Ferozo
        $mail->isSMTP();
        $mail->Host       = defined('SMTP_HOST') ? SMTP_HOST : 'a0190776.ferozo.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = defined('SMTP_USERNAME') ? SMTP_USERNAME : 'noreply@marianestilista.com.ar';
        $mail->Password   = defined('SMTP_PASSWORD') ? SMTP_PASSWORD : 'CasaMoneda5050/';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL (puerto 465)
        $mail->Port       = defined('SMTP_PORT') ? (int)SMTP_PORT : 465;
        $mail->CharSet    = 'UTF-8';
        $mail->Timeout    = 15;

        // Remitente oficial y canal de respuesta
        $fromAddress = defined('MAIL_FROM_ADDRESS') ? MAIL_FROM_ADDRESS : 'noreply@marianestilista.com.ar';
        $fromName    = defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'Marian Estilista';
        $mail->setFrom($fromAddress, $fromName);
        $mail->addReplyTo($fromAddress, $fromName);

        return $mail;
    }

    /**
     * Envía el correo de verificación de cuenta con token único y botón de acción.
     *
     * @param string $email
     * @param string $nombre
     * @param string $token
     * @return array ['success' => bool, 'url' => string, 'sent' => bool, 'error' => string|null]
     */
    public static function enviarCorreoVerificacion(string $email, string $nombre, string $token): array {
        $verificationUrl = self::generarUrlVerificacion($token);
        $asunto = "Confirmá tu correo electrónico — Marian Estilista";
        $htmlBody = self::construirPlantillaVerificacion($nombre, $verificationUrl);
        $textBody = "MARIAN ESTILISTA\nPeluquería & Colorimetría\n\nConfirmá tu correo electrónico\n\n¡Hola {$nombre}!\nGracias por registrarte.\nPara activar tu cuenta, hacé clic en el siguiente enlace:\n\n{$verificationUrl}\n\nEste enlace es válido durante 24 horas.\nSi no realizaste este registro, podés ignorar este correo.\n\nMarian Estilista — Galería La Catedral, San Carlos de Bariloche";

        $enviado = false;
        $errorMsg = null;

        try {
            $mail = self::createMailer();
            $mail->addAddress($email, $nombre);
            $mail->isHTML(true);
            $mail->Subject = $asunto;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $textBody;

            $mail->send();
            $enviado = true;
            error_log("[MailerService] Correo de verificación enviado exitosamente a <$email> vía SMTP a0190776.ferozo.com:465");
        } catch (Throwable $e) {
            $errorMsg = $e->getMessage();
            error_log("[MailerService ERROR] Fallo al enviar verificación a <$email>: " . $errorMsg);

            // Fallback opcional a mail() nativo si el socket SMTP externo estuviera temporalmente inaccesible
            try {
                $fromAddress = defined('MAIL_FROM_ADDRESS') ? MAIL_FROM_ADDRESS : 'noreply@marianestilista.com.ar';
                $fromName    = defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'Marian Estilista';
                $headers = [
                    'MIME-Version: 1.0',
                    'Content-Type: text/html; charset=UTF-8',
                    'From: ' . $fromName . ' <' . $fromAddress . '>',
                    'Reply-To: ' . $fromName . ' <' . $fromAddress . '>',
                    'X-Mailer: PHP/' . phpversion()
                ];
                $enviado = @mail($email, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $htmlBody, implode("\r\n", $headers));
            } catch (Throwable $eFallback) {
                // Registrar silenciosamente
            }
        }

        return [
            'success' => true,
            'url'     => $verificationUrl,
            'sent'    => $enviado,
            'error'   => $errorMsg
        ];
    }

    /**
     * Envía la notificación oficial a Marian cuando un cliente reserva un nuevo turno,
     * adjuntando el comprobante PDF del turno.
     *
     * @param array $reserva
     * @param string $pdfContent
     * @return array
     */
    public static function enviarNotificacionTurnoMarian(array $reserva, string $pdfContent = ''): array {
        $marianEmail = defined('MARIAN_NOTIFICATION_EMAIL') ? MARIAN_NOTIFICATION_EMAIL : 'marianestilista@gmail.com';
        $asunto = "📅 Nuevo turno reservado: " . ($reserva['servicio']['nombre'] ?? 'Servicio') . " — #" . ($reserva['id'] ?? '');

        $clienteNom = trim(($reserva['cliente']['nombre'] ?? '') . ' ' . ($reserva['cliente']['apellido'] ?? ''));
        $clienteTel = $reserva['cliente']['telefono'] ?? 'Sin teléfono';
        $clienteMail = $reserva['cliente']['email'] ?? 'Sin email';
        $servicioNom = $reserva['servicio']['nombre'] ?? 'Servicio';
        $fecha = $reserva['fecha'] ?? '';
        $hora = substr($reserva['hora'] ?? '00:00:00', 0, 5);
        $precio = '$' . number_format((float)($reserva['precio'] ?? 0), 0, ',', '.');

        $htmlBody = self::construirPlantillaNotificacionMarian($reserva);
        $textBody = "NUEVO TURNO CONFIRMADO\n\nCliente: {$clienteNom}\nTeléfono: {$clienteTel}\nEmail: {$clienteMail}\nServicio: {$servicioNom}\nFecha: {$fecha} a las {$hora} hs\nPrecio: {$precio}\n\nAdjuntamos el comprobante PDF oficial.\nMarian Estilista — Bariloche";

        try {
            $mail = self::createMailer();
            $mail->addAddress($marianEmail, 'Marian Estilista');
            $mail->isHTML(true);
            $mail->Subject = $asunto;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $textBody;

            if (!empty($pdfContent)) {
                $filename = 'ticket-turno-' . ($reserva['id'] ?? 'reserva') . '.pdf';
                $mail->addStringAttachment($pdfContent, $filename, 'base64', 'application/pdf');
            }

            $mail->send();
            return ['success' => true, 'sent' => true];
        } catch (Throwable $e) {
            error_log("[MailerService] Error al notificar a Marian: " . $e->getMessage());
            return ['success' => false, 'sent' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Envía el correo de confirmación de reserva al cliente con el ticket PDF adjunto.
     *
     * @param array $reserva
     * @param string $pdfContent
     * @return array
     */
    public static function enviarConfirmacionTurnoCliente(array $reserva, string $pdfContent = ''): array {
        $clienteMail = $reserva['cliente']['email'] ?? '';
        $clienteNom  = $reserva['cliente']['nombre'] ?? 'Clienta';
        if (empty($clienteMail)) {
            return ['success' => false, 'error' => 'Email de clienta no disponible'];
        }

        $asunto = "✨ Confirmación de tu turno: " . ($reserva['servicio']['nombre'] ?? 'Servicio') . " — Marian Estilista";
        $htmlBody = self::construirPlantillaConfirmacionCliente($reserva);
        $textBody = "¡HOLA {$clienteNom}!\nTu turno en Marian Estilista ha sido registrado con éxito.\nFecha: " . ($reserva['fecha'] ?? '') . " a las " . substr($reserva['hora'] ?? '00:00', 0, 5) . " hs.\nServicio: " . ($reserva['servicio']['nombre'] ?? '') . "\n\nEncontrás adjunto tu comprobante oficial en formato PDF.\nTe esperamos en Galería La Catedral, San Carlos de Bariloche.\nMarian Estilista";

        try {
            $mail = self::createMailer();
            $mail->addAddress($clienteMail, $clienteNom);
            $mail->isHTML(true);
            $mail->Subject = $asunto;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $textBody;

            if (!empty($pdfContent)) {
                $filename = 'ticket-turno-' . ($reserva['id'] ?? 'reserva') . '.pdf';
                $mail->addStringAttachment($pdfContent, $filename, 'base64', 'application/pdf');
            }

            $mail->send();
            return ['success' => true, 'sent' => true];
        } catch (Throwable $e) {
            error_log("[MailerService] Error al enviar confirmación al cliente: " . $e->getMessage());
            return ['success' => false, 'sent' => false, 'error' => $e->getMessage()];
        }
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
        $scriptPath = $_SERVER['SCRIPT_NAME'] ?? '';
        
        if (preg_match('#^(.*?/(marian-estilista|peluqueria-portal))#i', $scriptPath, $m)) {
            $basePath = $m[1];
        } else {
            $basePath = '';
        }

        return rtrim($protocol . $host . $basePath, '/') . '/verificar-email.php?token=' . urlencode($token);
    }

    /**
     * Plantilla HTML de Verificación de Correo (Estética Marian Estilista: Negro, Ocre Dorado, Tipografía Refinada)
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
  <title>Confirmá tu correo electrónico — Marian Estilista</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0A0503;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #F3ECE7;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0A0503;
      padding: 40px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #170E0A;
      border: 1px solid #362218;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: #120A07;
      padding: 35px 30px 25px;
      text-align: center;
      border-bottom: 1px solid #362218;
    }
    .brand-symbol {
      display: inline-block;
      width: 44px;
      height: 44px;
      line-height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #B36B00 0%, #D98C16 100%);
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .brand-title {
      margin: 0;
      font-size: 22px;
      letter-spacing: 3px;
      font-weight: 700;
      color: #FFFFFF;
      text-transform: uppercase;
    }
    .brand-sub {
      margin: 6px 0 0;
      font-size: 11px;
      letter-spacing: 2px;
      color: #C5A880;
      text-transform: uppercase;
    }
    .content {
      padding: 40px 35px;
      text-align: center;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #FFFFFF;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .message {
      font-size: 15px;
      color: #D1C7C0;
      margin-bottom: 30px;
      line-height: 1.6;
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
      text-align: left;
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
          ¡Hola, {$nombreEscapado}! Gracias por registrarte en Marian Estilista.
        </p>
        <p class="message">
          Para activar tu cuenta y poder agendar tus turnos exclusivos, hacé clic en el botón a continuación:
        </p>
        <div style="margin: 30px 0;">
          <a href="{$urlEscapada}" target="_blank" class="btn-verify">VERIFICAR MI CORREO</a>
        </div>
        <p style="font-size: 13.5px; color: #D1C7C0; margin-top: 24px; line-height: 1.5;">
          Este enlace es válido durante 24 horas.
        </p>
        <p style="font-size: 12.5px; color: #8A7C73; margin-top: 8px;">
          Si no creaste una cuenta en nuestro salón, podés ignorar este correo de forma segura.
        </p>
        <div class="alt-link">
          Si el botón no abre correctamente, copiá y pegá este enlace en tu navegador:<br>
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

    /**
     * Plantilla HTML de Notificación interna para Marian cuando entra un nuevo turno.
     *
     * @param array $reserva
     * @return string
     */
    private static function construirPlantillaNotificacionMarian(array $reserva): string {
        $id = htmlspecialchars((string)($reserva['id'] ?? '—'), ENT_QUOTES, 'UTF-8');
        $clienteNom = htmlspecialchars(trim(($reserva['cliente']['nombre'] ?? '') . ' ' . ($reserva['cliente']['apellido'] ?? '')), ENT_QUOTES, 'UTF-8');
        $clienteTel = htmlspecialchars((string)($reserva['cliente']['telefono'] ?? 'Sin teléfono'), ENT_QUOTES, 'UTF-8');
        $clienteMail = htmlspecialchars((string)($reserva['cliente']['email'] ?? 'Sin email'), ENT_QUOTES, 'UTF-8');
        $servicioNom = htmlspecialchars((string)($reserva['servicio']['nombre'] ?? 'Servicio'), ENT_QUOTES, 'UTF-8');
        $fecha = htmlspecialchars((string)($reserva['fecha'] ?? '—'), ENT_QUOTES, 'UTF-8');
        $hora = htmlspecialchars(substr((string)($reserva['hora'] ?? '00:00'), 0, 5), ENT_QUOTES, 'UTF-8');
        $duracion = (int)($reserva['duracion_minutos'] ?? 60);
        $precio = '$' . number_format((float)($reserva['precio'] ?? 0), 0, ',', '.');
        $obs = !empty($reserva['observaciones']) ? htmlspecialchars((string)$reserva['observaciones'], ENT_QUOTES, 'UTF-8') : 'Ninguna';

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nuevo Turno Reservado — Marian Estilista</title>
</head>
<body style="margin: 0; padding: 0; background: #0A0503; font-family: Arial, sans-serif; color: #F3ECE7;">
  <div style="max-width: 600px; margin: 30px auto; background: #170E0A; border: 1px solid #362218; border-radius: 12px; overflow: hidden;">
    <div style="background: #120A07; padding: 25px; text-align: center; border-bottom: 1px solid #362218;">
      <h1 style="color: #D98C16; font-size: 20px; margin: 0; letter-spacing: 2px;">MARIAN ESTILISTA</h1>
      <p style="color: #C5A880; font-size: 12px; margin: 5px 0 0; text-transform: uppercase;">Nuevo Turno Registrado</p>
    </div>
    <div style="padding: 30px 25px;">
      <h2 style="color: #FFFFFF; font-size: 18px; margin-top: 0;">Turno #{$id} confirmado en el sistema</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; color: #F3ECE7; font-size: 14px;">
        <tr style="border-bottom: 1px solid #2A1B14;"><td style="padding: 10px 0; color: #C5A880; width: 35%;">Clienta:</td><td style="padding: 10px 0; font-weight: bold;">{$clienteNom}</td></tr>
        <tr style="border-bottom: 1px solid #2A1B14;"><td style="padding: 10px 0; color: #C5A880;">Teléfono:</td><td style="padding: 10px 0;"><a href="tel:{$clienteTel}" style="color: #D98C16; text-decoration: none;">📱 {$clienteTel}</a></td></tr>
        <tr style="border-bottom: 1px solid #2A1B14;"><td style="padding: 10px 0; color: #C5A880;">Email:</td><td style="padding: 10px 0;">{$clienteMail}</td></tr>
        <tr style="border-bottom: 1px solid #2A1B14;"><td style="padding: 10px 0; color: #C5A880;">Servicio:</td><td style="padding: 10px 0; font-weight: bold;">{$servicioNom}</td></tr>
        <tr style="border-bottom: 1px solid #2A1B14;"><td style="padding: 10px 0; color: #C5A880;">Fecha y Hora:</td><td style="padding: 10px 0; font-weight: bold; color: #FFFFFF;">📅 {$fecha} — ⏰ {$hora} hs ({$duracion} min)</td></tr>
        <tr style="border-bottom: 1px solid #2A1B14;"><td style="padding: 10px 0; color: #C5A880;">Valor Estimado:</td><td style="padding: 10px 0; font-weight: bold; color: #D98C16;">{$precio}</td></tr>
        <tr><td style="padding: 10px 0; color: #C5A880;">Observaciones:</td><td style="padding: 10px 0;">{$obs}</td></tr>
      </table>
      <p style="margin-top: 25px; font-size: 13px; color: #D1C7C0;">Se adjunta automáticamente el comprobante oficial en formato PDF para el archivo del salón.</p>
    </div>
    <div style="background: #120A07; padding: 15px; text-align: center; font-size: 11px; color: #8A7C73; border-top: 1px solid #362218;">
      Panel de Gestión • Marian Estilista — Bariloche
    </div>
  </div>
</body>
</html>
HTML;
    }

    /**
     * Plantilla HTML de Confirmación para la Clienta con datos de su turno.
     *
     * @param array $reserva
     * @return string
     */
    private static function construirPlantillaConfirmacionCliente(array $reserva): string {
        $clienteNom = htmlspecialchars((string)($reserva['cliente']['nombre'] ?? 'Clienta'), ENT_QUOTES, 'UTF-8');
        $servicioNom = htmlspecialchars((string)($reserva['servicio']['nombre'] ?? 'Servicio'), ENT_QUOTES, 'UTF-8');
        $fecha = htmlspecialchars((string)($reserva['fecha'] ?? '—'), ENT_QUOTES, 'UTF-8');
        $hora = htmlspecialchars(substr((string)($reserva['hora'] ?? '00:00'), 0, 5), ENT_QUOTES, 'UTF-8');
        $precio = '$' . number_format((float)($reserva['precio'] ?? 0), 0, ',', '.');

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Confirmación de Turno — Marian Estilista</title>
</head>
<body style="margin: 0; padding: 0; background: #0A0503; font-family: Arial, sans-serif; color: #F3ECE7;">
  <div style="max-width: 600px; margin: 30px auto; background: #170E0A; border: 1px solid #362218; border-radius: 12px; overflow: hidden;">
    <div style="background: #120A07; padding: 25px; text-align: center; border-bottom: 1px solid #362218;">
      <h1 style="color: #D98C16; font-size: 20px; margin: 0; letter-spacing: 2px;">MARIAN ESTILISTA</h1>
      <p style="color: #C5A880; font-size: 12px; margin: 5px 0 0; text-transform: uppercase;">Peluquería & Colorimetría</p>
    </div>
    <div style="padding: 30px 25px; text-align: center;">
      <h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">¡Tu turno está confirmado, {$clienteNom}!</h2>
      <p style="font-size: 15px; color: #D1C7C0; line-height: 1.6;">Mariano te espera para brindarte una experiencia exclusiva y personalizada.</p>
      <div style="background: #120A07; border: 1px solid #362218; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: left;">
        <p style="margin: 6px 0; font-size: 14px;"><strong style="color: #C5A880;">Servicio:</strong> {$servicioNom}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong style="color: #C5A880;">Fecha y Hora:</strong> 📅 {$fecha} a las ⏰ {$hora} hs</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong style="color: #C5A880;">Lugar:</strong> Galería La Catedral, San Carlos de Bariloche</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong style="color: #C5A880;">Valor Estimado:</strong> {$precio}</p>
      </div>
      <p style="font-size: 13px; color: #C5A880;">📎 Te adjuntamos tu ticket oficial en formato PDF para que puedas guardarlo o presentarlo.</p>
    </div>
    <div style="background: #120A07; padding: 15px; text-align: center; font-size: 11px; color: #8A7C73; border-top: 1px solid #362218;">
      Galería La Catedral, San Carlos de Bariloche • &copy; Marian Estilista
    </div>
  </div>
</body>
</html>
HTML;
    }
}
