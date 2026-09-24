<?php
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../services/CertificadoService.php';

class CertificadoController {
    public function handle(string $action): void {
        $method = $action === 'generar' ? 'POST' : 'GET';
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
            header('Allow: ' . $method);
            jsonResponse(false, 'Método no permitido.', null, 405);
        }
        if ($action !== 'validar') requireAdmin();
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        try {
            $service = new CertificadoService();
            if ($action === 'validar') {
                $token = $_GET['token'] ?? '';
                $cert = $service->validar(is_string($token) ? $token : '');
                jsonResponse(true, 'Certificado válido.', $cert->toPublicArray());
            }
            $data = $action === 'generar' ? getRequestData() : $_GET;
            $id = filter_var($data['inscripcion_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($id === false) throw new DomainException('Inscripción no válida.', 400);
            $cert = $action === 'generar' ? $service->generar($id) : $service->obtener($id);
            if ($action === 'obtener') {
                $codigo = $cert->toPublicArray()['codigo_certificado'];
                header('Content-Type: application/pdf');
                header('Content-Disposition: inline; filename="' . $codigo . '.pdf"');
                echo $cert->pdf();
                return;
            }
            jsonResponse(true, 'Certificado generado correctamente.', $cert->toPublicArray());
        } catch (DomainException $e) {
            jsonResponse(false, $e->getMessage(), null, $e->getCode());
        } catch (Throwable $e) {
            error_log('[Certificados] ' . $e->getMessage());
            jsonResponse(false, 'No pudimos procesar el certificado. Intentá nuevamente más tarde.', null, 500);
        }
    }
}
