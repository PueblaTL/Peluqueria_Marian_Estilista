/**
 * storage.js - Módulo Centralizado de Persistencia y Acceso a Datos
 * Aura Studio - Portal Web Profesional
 * Conectado con MySQL a través de la API PHP (api/reservas.php) con soporte offline.
 */

const STORAGE_KEYS = {
  SERVICIOS: "aura_servicios_v1",
  PROFESIONAL: "aura_profesional_v1",
  EQUIPO: "aura_equipo_v1",
  TURNOS: "aura_turnos_v1",
  NEGOCIO: "aura_negocio_v1"
};

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

  /**
   * Inicializa localStorage con datos semilla si es la primera vez
   */
  static init() {
    if (typeof window === "undefined" || !window.SEED_DATA) return;

    if (!localStorage.getItem(STORAGE_KEYS.SERVICIOS)) {
      localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(window.SEED_DATA.servicios || []));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFESIONAL)) {
      localStorage.setItem(STORAGE_KEYS.PROFESIONAL, JSON.stringify(window.SEED_DATA.profesional || {}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EQUIPO)) {
      localStorage.setItem(STORAGE_KEYS.EQUIPO, JSON.stringify(window.SEED_DATA.equipo || []));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TURNOS)) {
      localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(window.SEED_DATA.turnos || []));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NEGOCIO)) {
      localStorage.setItem(STORAGE_KEYS.NEGOCIO, JSON.stringify(window.SEED_DATA.negocio || {}));
    }
  }

  static _getItem(key, fallback = []) {
    this.init();
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Error al leer ${key} de localStorage:`, e);
      return fallback;
    }
  }

  static _setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error al guardar ${key} en localStorage:`, e);
      return false;
    }
  }

  static resetToSeed() {
    if (typeof window === "undefined" || !window.SEED_DATA) return false;
    localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(window.SEED_DATA.servicios || []));
    localStorage.setItem(STORAGE_KEYS.PROFESIONAL, JSON.stringify(window.SEED_DATA.profesional || {}));
    localStorage.setItem(STORAGE_KEYS.EQUIPO, JSON.stringify(window.SEED_DATA.equipo || []));
    localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(window.SEED_DATA.turnos || []));
    localStorage.setItem(STORAGE_KEYS.NEGOCIO, JSON.stringify(window.SEED_DATA.negocio || {}));
    return true;
  }

  // ==========================================
  // SERVICIOS (MySQL con fallback a caché)
  // ==========================================
  static async getServicios(soloActivos = false) {
    try {
      const res = await fetch(this.getApiUrl('servicios'), { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          this._setItem(STORAGE_KEYS.SERVICIOS, json.data);
          return soloActivos ? json.data.filter(s => s.activo) : json.data;
        }
      }
    } catch (e) {
      // Servidor no disponible o ejecución offline: usa caché
    }

    const servicios = this._getItem(STORAGE_KEYS.SERVICIOS, window.SEED_DATA?.servicios || []);
    return soloActivos ? servicios.filter(s => s.activo) : servicios;
  }

  static async getServicioById(id) {
    const servicios = await this.getServicios();
    return servicios.find(s => String(s.id) === String(id) || s.clave === id || s.id === `srv-${id}`) || null;
  }

  // ==========================================
  // EQUIPO PROFESIONAL (MySQL con fallback)
  // ==========================================
  static async getEquipo() {
    try {
      const res = await fetch(this.getApiUrl('profesionales'), { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          this._setItem(STORAGE_KEYS.EQUIPO, json.data);
          return json.data;
        }
      }
    } catch (e) {
      // Fallback a caché
    }

    return this._getItem(STORAGE_KEYS.EQUIPO, window.SEED_DATA?.equipo || []);
  }

  static async getProfesional() {
    const equipo = await this.getEquipo();
    return equipo[0] || {
      id: 1,
      clave: "prof-1",
      nombre: "Valeria Benítez",
      titulo: "Directora Creativa & Master Colorist",
      especialidad: "Balayage, Colorimetría de Vanguardia y Visagismo"
    };
  }

  // ==========================================
  // NEGOCIO
  // ==========================================
  static async getNegocio() {
    return this._getItem(STORAGE_KEYS.NEGOCIO, window.SEED_DATA?.negocio || {
      nombre: "Aura Studio",
      horariosTexto: "Martes a Sábados de 09:00 a 19:00 hs",
      diasApertura: [2, 3, 4, 5, 6],
      horaApertura: "09:00",
      horaCierre: "19:00",
      intervaloTurnosMinutos: 30
    });
  }

  // ==========================================
  // DISPONIBILIDAD (MySQL con fallback)
  // ==========================================
  static async getDisponibilidad(fechaStr, duracionMinutos = 60, profesionalId = 1) {
    const profIdNum = typeof profesionalId === 'string' ? parseInt(profesionalId.replace(/\D/g, ''), 10) || 1 : Number(profesionalId) || 1;

    try {
      const res = await fetch(this.getApiUrl('disponibilidad', {
        fecha: fechaStr,
        duracion: duracionMinutos,
        profesional_id: profIdNum
      }), { signal: AbortSignal.timeout(3000) });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (e) {
      // Fallback a cálculo local
    }

    // Cálculo local si MySQL no está disponible
    return this._calcularDisponibilidadLocal(fechaStr, duracionMinutos, profesionalId);
  }

  static _calcularDisponibilidadLocal(fechaStr, duracionMinutos = 60, profesionalId) {
    if (!fechaStr) return [];
    const [y, m, d] = fechaStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay(); // 0 Dom, 1 Lun, 2 Mar ... 6 Sab

    // Martes a Sábado
    if (![2, 3, 4, 5, 6].includes(dayOfWeek)) {
      return [];
    }

    const turnosDelDia = this._getItem(STORAGE_KEYS.TURNOS, []).filter(t => {
      if (t.fecha !== fechaStr) return false;
      if (t.estado === "Cancelado") return false;
      if (profesionalId) {
        return String(t.profesionalId) === String(profesionalId) || String(t.profesionalId) === `prof-${profesionalId}`;
      }
      return true;
    });

    const horaInicioMin = 9 * 60;
    const horaFinMin = 19 * 60;
    const step = 30;

    const hoy = new Date();
    const esHoy = fechaStr === hoy.toISOString().split("T")[0];
    const minutosActuales = hoy.getHours() * 60 + hoy.getMinutes();

    const slots = [];
    for (let cur = horaInicioMin; cur + duracionMinutos <= horaFinMin; cur += step) {
      const hh = String(Math.floor(cur / 60)).padStart(2, "0");
      const mm = String(cur % 60).padStart(2, "0");
      const horaStr = `${hh}:${mm}`;

      if (esHoy && cur <= minutosActuales + 30) {
        slots.push({ hora: horaStr, disponible: false, motivo: "Horario pasado" });
        continue;
      }

      const slotFin = cur + duracionMinutos;
      const solapado = turnosDelDia.some(t => {
        const [th, tm] = t.hora.split(":").map(Number);
        const tIni = th * 60 + tm;
        const tFin = tIni + (t.duracionMinutos || 60);
        return cur < tFin && slotFin > tIni;
      });

      slots.push({
        hora: horaStr,
        disponible: !solapado,
        motivo: solapado ? "Horario ocupado" : "Disponible"
      });
    }

    return slots;
  }

  // ==========================================
  // REGISTRAR / GUARDAR TURNO (Persiste en MySQL)
  // ==========================================
  static async saveTurno(reservaDto) {
    const profIdNum = typeof reservaDto.profesionalId === 'string' 
      ? parseInt(reservaDto.profesionalId.replace(/\D/g, ''), 10) || 1 
      : Number(reservaDto.profesionalId) || 1;

    const srvIdNum = typeof reservaDto.servicioId === 'string'
      ? parseInt(reservaDto.servicioId.replace(/\D/g, ''), 10) || 1
      : Number(reservaDto.servicioId) || 1;

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

    let nuevoTurno = null;
    let guardadoEnMySQL = false;

    try {
      const res = await fetch(this.getApiUrl('crear'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const mensajeError = json.errors ? Object.values(json.errors).join(' ') : (json.error || 'No se pudo registrar la reserva.');
        throw new Error(mensajeError);
      }

      guardadoEnMySQL = true;
      nuevoTurno = {
        id: json.codigo || `TRN-${json.id}`,
        idNumero: json.id,
        servicioId: `srv-${srvIdNum}`,
        servicioNombre: json.reserva?.servicio_nombre || reservaDto.servicioNombre,
        profesionalId: `prof-${profIdNum}`,
        profesionalNombre: json.reserva?.profesional_nombre || reservaDto.profesionalNombre,
        fecha: reservaDto.fecha,
        hora: reservaDto.hora,
        duracionMinutos: payload.duracion_minutos,
        precio: payload.precio_estimado,
        estado: "Pendiente",
        origen: "MySQL",
        cliente: reservaDto.cliente,
        creadoEn: new Date().toISOString()
      };
    } catch (e) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError') && !e.message.includes('Failed to fetch')) {
        // Es un error de validación o conflicto de horario del backend: propagar al usuario
        throw e;
      }
      console.warn("API de MySQL no disponible. Guardando localmente:", e.message);
    }

    // Si falló la conexión HTTP, guardar en localStorage como respaldo local
    if (!nuevoTurno) {
      nuevoTurno = {
        id: `trn-${Date.now().toString().slice(-6)}`,
        servicioId: reservaDto.servicioId,
        servicioNombre: reservaDto.servicioNombre,
        profesionalId: reservaDto.profesionalId,
        profesionalNombre: reservaDto.profesionalNombre,
        fecha: reservaDto.fecha,
        hora: reservaDto.hora,
        duracionMinutos: Number(reservaDto.duracionMinutos) || 60,
        precio: Number(reservaDto.precio) || 0,
        estado: "Pendiente",
        origen: "LocalStorage",
        cliente: reservaDto.cliente,
        creadoEn: new Date().toISOString()
      };
    }

    const turnos = this._getItem(STORAGE_KEYS.TURNOS, []);
    turnos.push(nuevoTurno);
    this._setItem(STORAGE_KEYS.TURNOS, turnos);

    return nuevoTurno;
  }

  static async getTurnos(filtros = {}) {
    let turnos = this._getItem(STORAGE_KEYS.TURNOS, []);
    if (filtros.fecha) turnos = turnos.filter(t => t.fecha === filtros.fecha);
    if (filtros.estado && filtros.estado !== "todos") {
      turnos = turnos.filter(t => t.estado.toLowerCase() === filtros.estado.toLowerCase());
    }
    return turnos;
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
