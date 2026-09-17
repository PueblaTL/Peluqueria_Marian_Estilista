<?php
/**
 * PdfTicketService.php - Generador de Tickets de Turno en PDF para Marian Estilista
 * Utiliza FPDF para producir comprobantes elegantes y profesionales en escala de grises.
 */

require_once __DIR__ . '/../libs/FPDF/fpdf.php';

class PdfTicketService {
    /**
     * Genera el PDF del ticket y retorna el contenido binario como string.
     *
     * @param array $turno Datos completos de la reserva
     * @return string Contenido binario del archivo PDF
     */
    public static function generarTicketPdf(array $turno): string {
        $pdf = new FPDF('P', 'mm', 'A4');
        $pdf->SetAutoPageBreak(true, 15);
        $pdf->AddPage();

        // Conversor seguro a ISO-8859-1 para compatibilidad nativa con las fuentes de FPDF
        $u = function(string $text): string {
            return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text);
        };

        // Colores de la identidad Marian Estilista (Negro, Grises y Blanco)
        $colorNegro = [18, 10, 7];
        $colorGrisOscuro = [54, 34, 24];
        $colorGrisClaro = [240, 240, 240];
        $colorTextoSec = [100, 100, 100];

        // Margen superior estético
        $pdf->SetY(20);

        // ==========================================
        // 1. ENCABEZADO DE MARCA
        // ==========================================
        $pdf->SetFont('Helvetica', 'B', 22);
        $pdf->SetTextColor(18, 18, 18);
        $pdf->Cell(0, 8, $u('MARIAN ESTILISTA'), 0, 1, 'C');

        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetTextColor(90, 90, 90);
        $pdf->Cell(0, 6, $u('PELUQUERÍA & COLORIMETRÍA DE AUTOR'), 0, 1, 'C');
        $pdf->Cell(0, 5, $u('Galería Paseo de la Catedral — San Carlos de Bariloche'), 0, 1, 'C');

        // Línea divisoria elegante
        $pdf->Ln(4);
        $pdf->SetDrawColor(200, 200, 200);
        $pdf->SetLineWidth(0.4);
        $pdf->Line(20, $pdf->GetY(), 190, $pdf->GetY());
        $pdf->Ln(6);

        // ==========================================
        // 2. TÍTULO Y NÚMERO DE TICKET
        // ==========================================
        $idTurno = $turno['id'] ?? '0000';
        $numTurnoStr = '#' . str_pad((string)$idTurno, 4, '0', STR_PAD_LEFT);

        $pdf->SetFont('Helvetica', 'B', 13);
        $pdf->SetTextColor(30, 30, 30);
        $pdf->Cell(95, 7, $u('COMPROBANTE DE TURNO'), 0, 0, 'L');

        $pdf->SetFont('Helvetica', 'B', 13);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(75, 7, $u('Turno ' . $numTurnoStr), 0, 1, 'R');

        $pdf->Ln(2);

        // ==========================================
        // 3. TABLA DE DETALLES DEL TURNO
        // ==========================================
        // Parsear fecha al formato DD/MM/YYYY
        $fechaRaw = $turno['fecha'] ?? date('Y-m-d');
        $dtFecha = DateTime::createFromFormat('Y-m-d', $fechaRaw);
        $fechaFmt = $dtFecha ? $dtFecha->format('d/m/Y') : $fechaRaw;

        // Hora (HH:MM)
        $horaRaw = $turno['hora'] ?? '00:00';
        $horaFmt = substr($horaRaw, 0, 5);

        // Cliente
        $clienteNombre = trim(($turno['cliente']['nombre'] ?? ($turno['usuario_nombre'] ?? '')) . ' ' . ($turno['cliente']['apellido'] ?? ($turno['usuario_apellido'] ?? '')));
        if (empty($clienteNombre)) {
            $clienteNombre = 'Cliente Marian Estilista';
        }

        $clienteEmail = $turno['cliente']['email'] ?? ($turno['usuario_email'] ?? '-');
        $clienteTel = $turno['cliente']['telefono'] ?? ($turno['usuario_telefono'] ?? '-');

        // Servicio
        $servicioNombre = $turno['servicio']['nombre'] ?? ($turno['servicio_nombre'] ?? 'Servicio Marian Estilista');
        
        // Precio
        $precioNum = (float)($turno['precio'] ?? ($turno['servicio']['precio'] ?? 0));
        $precioTexto = $turno['precio_texto'] ?? ($turno['servicio']['precio_texto'] ?? ($turno['servicio']['precioTexto'] ?? ''));
        if (empty($precioTexto)) {
            if (stripos($servicioNombre, 'novia') !== false) {
                $precioTexto = 'Desde $80.000';
            } else {
                $precioTexto = '$' . number_format($precioNum, 0, ',', '.');
            }
        }

        // Duración
        $duracion = (int)($turno['duracion_minutos'] ?? ($turno['duracionMinutos'] ?? ($turno['servicio']['duracion_minutos'] ?? 60)));

        // Profesional
        $profNombre = $turno['profesional']['nombre'] ?? ($turno['profesional_nombre'] ?? 'Mariano');

        // Estado
        $estado = strtoupper($turno['estado'] ?? 'CONFIRMADA');
        $estadoFmt = ($estado === 'CONFIRMADA' || $estado === 'CONFIRMADO') ? 'Confirmado' : (($estado === 'PENDIENTE') ? 'Pendiente' : ucfirst(strtolower($estado)));

        // Estructura de filas
        $filas = [
            ['Número de turno:', $numTurnoStr],
            ['Cliente:', $clienteNombre],
            ['Email:', $clienteEmail],
            ['Teléfono:', $clienteTel],
            ['Servicio:', $servicioNombre],
            ['Precio:', $precioTexto],
            ['Duración estimada:', $duracion . ' minutos'],
            ['Fecha del turno:', $fechaFmt],
            ['Hora del turno:', $horaFmt . ' hs'],
            ['Profesional asignado:', $profNombre],
            ['Estado de la reserva:', $estadoFmt]
        ];

        // Dibujar caja contenedora
        $pdf->SetDrawColor(220, 220, 220);
        $pdf->SetFillColor(250, 250, 250);

        foreach ($filas as $index => $item) {
            $esPar = ($index % 2 === 0);
            $fill = $esPar;

            $pdf->SetFont('Helvetica', 'B', 10);
            $pdf->SetTextColor(60, 60, 60);
            $pdf->Cell(55, 8, '  ' . $u($item[0]), 1, 0, 'L', $fill);

            $pdf->SetFont('Helvetica', '', 10);
            $pdf->SetTextColor(15, 15, 15);
            $pdf->Cell(115, 8, '  ' . $u($item[1]), 1, 1, 'L', $fill);
        }

        // ==========================================
        // 4. POLÍTICAS Y RECOMENDACIONES
        // ==========================================
        $pdf->Ln(8);
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->SetTextColor(80, 80, 80);
        $pdf->Cell(0, 5, $u('INFORMACIÓN IMPORTANTE PARA TU VISITA:'), 0, 1, 'L');

        $pdf->SetFont('Helvetica', '', 8.5);
        $pdf->SetTextColor(110, 110, 110);
        $pdf->MultiCell(0, 4.5, $u(
            "• Te recomendamos presentarte con 5 a 10 minutos de anticipación en Galería Paseo de la Catedral (Bariloche).\n" .
            "• En caso de necesitar cancelar o reprogramar tu turno, te solicitamos avisar con un mínimo de 24 horas de antelación.\n" .
            "• Para consultas directas o indicaciones sobre tu preparación previa, podés comunicarte vía WhatsApp al +54 2920 359074."
        ));

        // ==========================================
        // 5. PIE DE PÁGINA
        // ==========================================
        $pdf->SetY(-30);
        $pdf->SetDrawColor(200, 200, 200);
        $pdf->SetLineWidth(0.3);
        $pdf->Line(20, $pdf->GetY(), 190, $pdf->GetY());
        $pdf->Ln(3);

        $pdf->SetFont('Helvetica', 'I', 8);
        $pdf->SetTextColor(140, 140, 140);
        $pdf->Cell(0, 4, $u('Marian Estilista — Cuidado exclusivo, técnicas avanzadas y atención personalizada.'), 0, 1, 'C');
        $pdf->Cell(0, 4, $u('Este documento sirve como comprobante oficial de turno reservado a través del portal web.'), 0, 1, 'C');

        return $pdf->Output('S');
    }

    /**
     * Guarda el ticket directamente en un archivo del servidor (opcional).
     *
     * @param array $turno
     * @param string $rutaDestino
     * @return bool
     */
    public static function guardarTicketEnArchivo(array $turno, string $rutaDestino): bool {
        $contenido = self::generarTicketPdf($turno);
        return file_put_contents($rutaDestino, $contenido) !== false;
    }
}
