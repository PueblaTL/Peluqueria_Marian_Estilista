/**
 * storage.js - Módulo Centralizado de Persistencia y Acceso a Datos
 * Aura Studio - Portal Web Profesional
 * Conectado con MySQL a través de la API PHP (api/reservas.php) sin confirmaciones locales.
 */

class StorageService {
  /**
   * Determina la URL de la API PHP según el contexto de ejecución
   */
  static getApiUrl(action, params = {}) {
    const isPages = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
    const basePath = isPages ? '../api/reservas.php' : 'api/reservas.php';
    try {
      const url = new URL(basePath, window.location.href);
      url.searchParams.set('action', action);
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, String(v));
        }
      }
      return url.toString();
    } catch {
      return basePath + '?action=' + encodeURIComponent(action);
    }
  }

  static init() {}
  static resetToSeed() { return false; }

  static async request(action, params = {}, options = {}) {
    let res;
    try { res = await fetch(this.getApiUrl(action, params), options); }
    catch { throw new Error('No se pudo conectar al servidor. No se guardó ninguna reserva.'); }
    if (!(res.headers.get('content-type') || '').includes('application/json')) throw new Error('Respuesta inválida del servidor. Abrí el sitio desde PHP.');
    let json;
    try { json = await res.json(); } catch { throw new Error('El servidor devolvió JSON inválido.'); }
    if (!res.ok || !json.success) throw new Error(json.message || 'No se pudo completar la solicitud.');
    return json;
  }
  static async getServicios(soloActivos = false) {
    const {data} = await this.request('servicios');
    return soloActivos ? data.filter(s => s.activo) : data;
  }

  static async getServicioById(id) {
    const servicios = await this.getServicios();
    return servicios.find(s => String(s.id) === String(id) || s.clave === id || s.id === `srv-${id}`) || null;
  }

  // ==========================================
  // EQUIPO PROFESIONAL (MySQL)
  // ==========================================
  static async getEquipo() { return (await this.request('profesionales')).data; }

  static async getProfesional() {
    const equipo = await this.getEquipo();
    return equipo[0] || null;
  }

  // ==========================================
  // NEGOCIO
  // ==========================================
  static async getNegocio() {
    return (await this.request('negocio')).data;
  }

  // ==========================================
  // DISPONIBILIDAD (MySQL)
  // ==========================================
  static async getDisponibilidad(fechaStr, duracionMinutos = 60, profesionalId = 1) {
    const profIdNum = Number(profesionalId) || 0;

    return (await this.request('disponibilidad', {fecha: fechaStr, duracion: duracionMinutos, profesional_id: profIdNum})).data;
  }

  static async saveTurno(reservaDto) {
    const profIdNum = Number(reservaDto.profesionalId);
    const srvIdNum = Number(reservaDto.servicioId);
    if (!Number.isInteger(profIdNum) || profIdNum < 1 || !Number.isInteger(srvIdNum) || srvIdNum < 1) throw new Error('Seleccioná un servicio y profesional válidos.');

    const payload = {
      profesional_id: profIdNum,
      servicio_id: srvIdNum,
      fecha: reservaDto.fecha,
      hora: reservaDto.hora,
      duracion_minutos: Number(reservaDto.duracionMinutos) || 60,
      precio_estimado: Number(reservaDto.precio) || 0,
      cliente_nombre: reservaDto.cliente?.nombre || "",
      cliente_apellido: reservaDto.cliente?.apellido || "",
      cliente_email: reservaDto.cliente?.email || "",
      cliente_telefono: reservaDto.cliente?.telefono || "",
      observaciones: reservaDto.cliente?.notas || ""
    };

    const json = await this.request('crear', {}, {method: 'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    return {id:json.codigo,idNumero:json.id,servicioId:reservaDto.servicioId,servicioNombre:json.reserva.servicio_nombre,profesionalId:reservaDto.profesionalId,profesionalNombre:json.reserva.profesional_nombre,fecha:json.reserva.fecha,hora:json.reserva.hora,duracionMinutos:json.reserva.duracion_minutos,precio:json.reserva.precio_estimado,estado:json.reserva.estado,cliente:reservaDto.cliente,origen:'MySQL'};
  }

  static async getTurnos(filtros = {}) {
    throw new Error('Las reservas se consultan desde el panel de administración.');
  }
}

if (typeof window !== "undefined") {
  window.StorageService = StorageService;
  document.addEventListener("DOMContentLoaded", () => {
    StorageService.init();
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = StorageService;
}
