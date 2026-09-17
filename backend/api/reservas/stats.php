<?php
/**
 * stats.php - Endpoint de KPIs para el Dashboard de Administración
 * Marian Estilista - Backend
 * Requiere rol ADMIN y sesión activa.
 */

require_once __DIR__ . '/../../config/helpers.php';
require_once __DIR__ . '/../../config/Database.php';

requireAdmin();

try {
    $db = Database::getConnection();
    $hoy = date('Y-m-d');

    // ── Turnos de hoy ──────────────────────────────────────────────────────────
    $stmtHoy = $db->prepare(
        "SELECT COUNT(*) FROM `reservas`
         WHERE `fecha` = :hoy AND `estado` != 'CANCELADA'"
    );
    $stmtHoy->execute([':hoy' => $hoy]);
    $turnosHoy = (int)$stmtHoy->fetchColumn();

    // ── Turnos pendientes ──────────────────────────────────────────────────────
    $stmtPend = $db->query(
        "SELECT COUNT(*) FROM `reservas` WHERE `estado` = 'PENDIENTE'"
    );
    $turnosPendientes = (int)$stmtPend->fetchColumn();

    // ── Turnos confirmados ─────────────────────────────────────────────────────
    $stmtConf = $db->query(
        "SELECT COUNT(*) FROM `reservas` WHERE `estado` = 'CONFIRMADA'"
    );
    $turnosConfirmados = (int)$stmtConf->fetchColumn();

    // ── Turnos completados (total histórico) ───────────────────────────────────
    $stmtComp = $db->query(
        "SELECT COUNT(*) FROM `reservas` WHERE `estado` = 'COMPLETADA'"
    );
    $turnosCompletados = (int)$stmtComp->fetchColumn();

    // ── Total clientes activos ─────────────────────────────────────────────────
    $stmtClientes = $db->query(
        "SELECT COUNT(*) FROM `usuarios` WHERE `rol` = 'CLIENTE' AND `activo` = 1"
    );
    $totalClientes = (int)$stmtClientes->fetchColumn();

    // ── Ingresos estimados (suma de reservas completadas + confirmadas) ─────────
    $stmtIngresos = $db->query(
        "SELECT COALESCE(SUM(`precio`), 0) FROM `reservas`
         WHERE `estado` IN ('COMPLETADA', 'CONFIRMADA')"
    );
    $ingresosEstimados = (float)$stmtIngresos->fetchColumn();

    // ── Turnos del mes en curso ────────────────────────────────────────────────
    $stmtMes = $db->prepare(
        "SELECT COUNT(*) FROM `reservas`
         WHERE YEAR(`fecha`) = :anio AND MONTH(`fecha`) = :mes AND `estado` != 'CANCELADA'"
    );
    $stmtMes->execute([':anio' => date('Y'), ':mes' => date('n')]);
    $turnosMes = (int)$stmtMes->fetchColumn();

    // ── Próximos turnos (hoy en adelante, pendientes o confirmados) ────────────
    $stmtProximos = $db->prepare(
        "SELECT COUNT(*) FROM `reservas`
         WHERE `fecha` >= :hoy AND `estado` IN ('PENDIENTE', 'CONFIRMADA')"
    );
    $stmtProximos->execute([':hoy' => $hoy]);
    $proximosTurnos = (int)$stmtProximos->fetchColumn();

    // ── Total inscripciones al curso ──────────────────────────────────────────
    $totalInscripciones = 0;
    try {
        $stmtIns = $db->query("SELECT COUNT(*) FROM `inscripciones_curso`");
        if ($stmtIns) {
            $totalInscripciones = (int)$stmtIns->fetchColumn();
        }
    } catch (Exception $eIns) {}

    jsonResponse(true, "Estadísticas del dashboard obtenidas correctamente.", [
        'turnosHoy'          => $turnosHoy,
        'turnosPendientes'   => $turnosPendientes,
        'turnosConfirmados'  => $turnosConfirmados,
        'turnosCompletados'  => $turnosCompletados,
        'totalClientes'      => $totalClientes,
        'ingresosEstimados'  => $ingresosEstimados,
        'turnosMes'          => $turnosMes,
        'proximosTurnos'     => $proximosTurnos,
        'inscripcionesCurso' => $totalInscripciones
    ], 200);

} catch (Exception $e) {
    jsonResponse(false, "Error al obtener estadísticas: " . $e->getMessage(), null, 500, 'STATS_ERROR');
}
