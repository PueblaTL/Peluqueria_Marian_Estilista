<?php

class CertificadoPdfService {
    public static function generar(array $data): string {
        require_once __DIR__ . '/../vendor/autoload.php';
        require_once __DIR__ . '/../libs/FPDF/fpdf.php';

        $url = rtrim(APP_URL, '/') . '/certificado.html?token=' . $data['token_validacion'];
        $matrix = \BaconQrCode\Encoder\Encoder::encode(
            $url, \BaconQrCode\Common\ErrorCorrectionLevel::M(), 'UTF-8'
        )->getMatrix();
        $pdf = new FPDF('L', 'mm', 'A4');
        $pdf->SetAutoPageBreak(false);
        $pdf->SetMargins(24, 16, 24);
        $pdf->AddPage();
        $pdf->SetTitle('Certificado de Finalización - Marian Estilista', true);
        $pdf->SetAuthor('Marian Estilista');
        // Degradado vectorial marfil/crema/beige: liviano y nítido al imprimir.
        $ivory = [253, 250, 245];
        $beige = [240, 226, 207];
        for ($step = 0; $step < 420; $step++) {
            $mix = $step / 419;
            $pdf->SetFillColor(
                (int)round($ivory[0] + ($beige[0] - $ivory[0]) * $mix),
                (int)round($ivory[1] + ($beige[1] - $ivory[1]) * $mix),
                (int)round($ivory[2] + ($beige[2] - $ivory[2]) * $mix)
            );
            $pdf->Rect(0, $step * 0.5, 297, 0.51, 'F');
        }
        $pdf->SetDrawColor(181, 151, 111);
        $pdf->SetLineWidth(0.35);
        $pdf->Rect(9, 9, 279, 192);
        $pdf->SetLineWidth(0.2);
        $pdf->SetDrawColor(215, 196, 171);
        $pdf->Rect(12, 12, 273, 186);
        // Remates de esquina discretos, sin ocupar el área de texto.
        $pdf->SetDrawColor(181, 151, 111);
        foreach ([[15, 15, 1, 1], [282, 15, -1, 1], [15, 195, 1, -1], [282, 195, -1, -1]] as [$x, $y, $dx, $dy]) {
            $pdf->Line($x, $y, $x + 13 * $dx, $y);
            $pdf->Line($x, $y, $x, $y + 13 * $dy);
            $pdf->Line($x, $y + 4 * $dy, $x + 4 * $dx, $y);
        }

        // Copia RGBA optimizada: conserva la transparencia y evita incrustar 2 MB.
        $logo = __DIR__ . '/../assets/logo-certificado.png';
        $pdf->Image($logo, 132.5, 16, 32, 32);
        $text = static fn(string $value): string => iconv('UTF-8', 'windows-1252//TRANSLIT', $value);
        $line = static function (string $value, float $y, int $size, string $style = '', float $width = 249, float $height = 8, string $font = 'Helvetica') use ($pdf, $text): void {
            $value = $text($value);
            $pdf->SetFont($font, $style, $size);
            while ($pdf->GetStringWidth($value) > $width && $size > 8) {
                $pdf->SetFontSize(--$size);
            }
            $pdf->SetXY((297 - $width) / 2, $y);
            $pdf->MultiCell($width, $height, $value, 0, 'C');
        };
        $pdf->SetTextColor(115, 90, 64);
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetXY(30, 29);
        $pdf->Cell(87, 6, $text('F O R M A C I Ó N  P R O F E S I O N A L'), 0, 0, 'C');
        $pdf->SetXY(180, 29);
        $pdf->Cell(87, 6, 'M A R I A N  E S T I L I S T A', 0, 0, 'C');
        $pdf->SetDrawColor(199, 175, 144);
        $pdf->Line(46, 38, 101, 38);
        $pdf->Line(196, 38, 251, 38);

        $pdf->SetTextColor(69, 50, 36);
        $line('Certificado de Finalización', 56, 32, '', 249, 11, 'Times');
        $pdf->SetTextColor(115, 90, 64);
        $line('Se certifica que', 75, 11);
        $pdf->SetTextColor(62, 44, 32);
        $line($data['nombre_alumno'], 87, 34, 'BI', 239, 6, 'Times');

        $pdf->SetDrawColor(183, 151, 111);
        $pdf->Line(53, 110, 143, 110);
        $pdf->Line(154, 110, 244, 110);
        foreach ([[148.5, 108, 151, 110], [151, 110, 148.5, 112], [148.5, 112, 146, 110], [146, 110, 148.5, 108]] as $edge) {
            $pdf->Line(...$edge);
        }
        $pdf->SetTextColor(115, 90, 64);
        $line('completó satisfactoriamente el', 113, 11);
        $pdf->SetTextColor(69, 50, 36);
        $line($data['nombre_curso'], 124, 16, 'B', 241, 6);
        $fecha = static fn(string $v): string => (new DateTimeImmutable($v))->format('d/m/Y');
        $pdf->SetTextColor(115, 90, 64);
        $line('Finalización: ' . $fecha($data['fecha_finalizacion']) . '    |    Emisión: ' . $fecha($data['fecha_emision']), 136, 10);

        $pdf->SetDrawColor(204, 182, 153);
        $pdf->Line(27, 148, 217, 148);
        $pdf->Line(122, 155, 122, 183);
        $pdf->SetTextColor(88, 67, 48);
        $pdf->SetFont('Helvetica', 'B', 8);
        $pdf->SetXY(132, 156);
        $pdf->Cell(80, 5, $text('CAPACITACIÓN PRIVADA'), 0, 1, 'C');
        $pdf->SetFont('Helvetica', '', 9);
        $pdf->SetXY(132, 164);
        $pdf->MultiCell(80, 4.5, $text('Impartida por Marian Estilista. Este certificado acredita la realización y finalización del curso.'), 0, 'C');
        $pdf->SetDrawColor(181, 151, 111);
        // PNG original con transparencia, centrado sobre la línea sin deformarlo.
        $firma = __DIR__ . '/../../frontend/assets/images/FirmaDigitalMariano.png';
        [$firmaAncho, $firmaAlto] = getimagesize($firma);
        $firmaAltura = 22;
        $firmaAnchura = $firmaAltura * $firmaAncho / $firmaAlto;
        $pdf->Image($firma, 73 - $firmaAnchura / 2, 150, $firmaAnchura, $firmaAltura, 'PNG');
        $pdf->Line(38, 173, 108, 173);
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->SetXY(30, 175);
        $pdf->Cell(86, 5, $text('Jesús Echavarria'), 0, 1, 'C');
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->SetX(30);
        $pdf->Cell(86, 5, $text('Instructor'), 0, 1, 'C');

        // QR vectorial con cuatro módulos blancos de margen; no requiere servicios externos.
        $size = $matrix->getWidth();
        $unit = 37 / ($size + 8);
        $pdf->SetFillColor(255, 255, 255);
        $pdf->Rect(235, 148, 37, 37, 'F');
        $pdf->SetFillColor(0, 0, 0);
        for ($y = 0; $y < $size; $y++) {
            for ($x = 0; $x < $size; $x++) {
                if ($matrix->get($x, $y) === 1) {
                    $pdf->Rect(235 + ($x + 4) * $unit, 148 + ($y + 4) * $unit, $unit, $unit, 'F');
                }
            }
        }
        $pdf->Link(235, 148, 37, 37, $url);
        $pdf->SetXY(230, 187);
        $pdf->SetFont('Helvetica', '', 7);
        $pdf->MultiCell(47, 3.2, $text('Escaneá para verificar la autenticidad del certificado.'), 0, 'C');
        $pdf->SetTextColor(115, 90, 64);
        $line($data['codigo_certificado'], 190, 8, '', 160, 5);
        return $pdf->Output('S');
    }
}
