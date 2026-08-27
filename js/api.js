/**
 * api.js - Capa de Abstracción REST API para Marian Estilista
 * 
 * Expone servicios limpios (ServicioService, TurnoService, CursoService, NegocioService)
 * delegando en StorageService. Diseñado para que en la futura versión con Spring Boot + PostgreSQL,
 * solo se reemplace el cuerpo de estos métodos por llamadas fetch() sin alterar la UI.
 */

// Utilidad para simular latencia de red en llamadas asíncronas
const simulateDelay = (ms = 40) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// SERVICIO SERVICE (Simula /api/v1/servicios)
// ==========================================
class ServicioService {
  static async getAll(soloActivos = false) {
    await simulateDelay();
    return window.StorageService.getServicios(soloActivos);
  }

  static async getById(id) {
    await simulateDelay();
    return window.StorageService.getServicioById(id);
  }

  static async create(servicioDto) {
    await simulateDelay();
    return window.StorageService.saveServicio(servicioDto);
  }

  static async update(id, servicioDto) {
    await simulateDelay();
    return window.StorageService.updateServicio(id, servicioDto);
  }

  static async delete(id) {
    await simulateDelay();
    return window.StorageService.deleteServicio(id);
  }
}

// ==========================================
// TURNO SERVICE (Simula /api/v1/turnos)
// ==========================================
class TurnoService {
  static async getAll(filtros = {}) {
    await simulateDelay();
    return window.StorageService.getTurnos(filtros);
  }

  static async getById(id) {
    await simulateDelay();
    return window.StorageService.getTurnoById(id);
  }

  static async create(reservaDto) {
    await simulateDelay();
    return window.StorageService.saveTurno(reservaDto);
  }

  static async updateEstado(id, nuevoEstado) {
    await simulateDelay();
    return window.StorageService.updateTurnoEstado(id, nuevoEstado);
  }

  static async delete(id) {
    await simulateDelay();
    return window.StorageService.deleteTurno(id);
  }

  static async getDisponibilidad(fechaStr, duracionMinutos) {
    await simulateDelay();
    return window.StorageService.getDisponibilidad(fechaStr, duracionMinutos);
  }
}

// ==========================================
// CURSO SERVICE (Simula /api/v1/curso)
// ==========================================
class CursoService {
  static async getInfo() {
    await simulateDelay();
    return window.StorageService.getCursoInfo();
  }

  static async getInscripciones() {
    await simulateDelay();
    return window.StorageService.getInscripciones();
  }

  static async inscribir(datosDto) {
    await simulateDelay();
    return window.StorageService.saveInscripcion(datosDto);
  }

  static async updateInscripcionEstado(id, estado) {
    await simulateDelay();
    return window.StorageService.updateInscripcionEstado(id, estado);
  }

  static async deleteInscripcion(id) {
    await simulateDelay();
    return window.StorageService.deleteInscripcion(id);
  }
}

// ==========================================
// CLIENTE SERVICE (Simula /api/v1/clientes)
// ==========================================
class ClienteService {
  static async getAll() {
    await simulateDelay();
    return window.StorageService.getClientes();
  }
}

// ==========================================
// NEGOCIO & PROFESIONAL SERVICE
// ==========================================
class NegocioService {
  static async getInfo() {
    await simulateDelay();
    return window.StorageService.getNegocio();
  }

  static async getProfesional() {
    await simulateDelay();
    return window.StorageService.getProfesional();
  }

  static async getDashboardKPIs() {
    await simulateDelay();
    return window.StorageService.getDashboardStats();
  }

  static async resetData() {
    await simulateDelay();
    return window.StorageService.resetToSeed();
  }
}

// Exportar globalmente
if (typeof window !== "undefined") {
  window.ServicioService = ServicioService;
  window.TurnoService = TurnoService;
  window.CursoService = CursoService;
  window.ClienteService = ClienteService;
  window.NegocioService = NegocioService;
}
