/**
 * api.js - Fachada de Servicios para Aura Studio
 * Conecta los módulos de la aplicación delegando en StorageService y la API backend PHP/MySQL.
 */

class ServicioService {
  static async getAll(soloActivos = false) {
    return window.StorageService.getServicios(soloActivos);
  }

  static async getById(id) {
    return window.StorageService.getServicioById(id);
  }
}

class TurnoService {
  static async getAll(filtros = {}) {
    return window.StorageService.getTurnos(filtros);
  }

  static async create(reservaDto) {
    return window.StorageService.saveTurno(reservaDto);
  }

  static async getDisponibilidad(fechaStr, duracionMinutos, profesionalId) {
    return window.StorageService.getDisponibilidad(fechaStr, duracionMinutos, profesionalId);
  }
}

class NegocioService {
  static async getInfo() {
    return window.StorageService.getNegocio();
  }

  static async getEquipo() {
    return window.StorageService.getEquipo();
  }

  static async getProfesional() {
    return window.StorageService.getProfesional();
  }

  static async resetData() {
    return window.StorageService.resetToSeed();
  }
}

// Exportar globalmente
if (typeof window !== "undefined") {
  window.ServicioService = ServicioService;
  window.TurnoService = TurnoService;
  window.NegocioService = NegocioService;
}
