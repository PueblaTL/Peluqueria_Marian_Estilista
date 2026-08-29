/**
 * storage.js - Módulo Centralizado de Persistencia y Acceso a Datos
 * Marian Estilista - Portal Web Profesional
 * 
 * Abstrae las operaciones de localStorage y prepara la interfaz para 
 * una posterior migración directa a una API REST (Java + Spring Boot + PostgreSQL).
 */

const STORAGE_KEYS = {
  SERVICIOS: "marian_servicios_v2",
  PROFESIONAL: "marian_profesional_v1",
  TURNOS: "marian_turnos_v2",
  CURSO: "marian_curso_v1",
  INSCRIPCIONES: "marian_inscripciones_v1",
  NEGOCIO: "marian_negocio_v1"
};

class StorageService {
  /**
   * Inicializa localStorage con datos semilla si es la primera vez
   */
  static init() {
    if (!window.SEED_DATA) {
      console.warn("SEED_DATA no está disponible aún.");
      return;
    }

    if (!localStorage.getItem(STORAGE_KEYS.SERVICIOS)) {
      localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(window.SEED_DATA.servicios));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFESIONAL)) {
      localStorage.setItem(STORAGE_KEYS.PROFESIONAL, JSON.stringify(window.SEED_DATA.profesional));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TURNOS)) {
      localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(window.SEED_DATA.turnos));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURSO)) {
      localStorage.setItem(STORAGE_KEYS.CURSO, JSON.stringify(window.SEED_DATA.curso));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INSCRIPCIONES)) {
      localStorage.setItem(STORAGE_KEYS.INSCRIPCIONES, JSON.stringify(window.SEED_DATA.inscripcionesCurso));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NEGOCIO)) {
      localStorage.setItem(STORAGE_KEYS.NEGOCIO, JSON.stringify(window.SEED_DATA.negocio));
    }
  }

  /**
   * Helper genérico de lectura
   */
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

  /**
   * Helper genérico de escritura
   */
  static _setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error al guardar ${key} en localStorage:`, e);
      return false;
    }
  }

  /**
   * Restablece todos los datos a los valores iniciales de data.js
   */
  static resetToSeed() {
    if (!window.SEED_DATA) return false;
    localStorage.setItem(STORAGE_KEYS.SERVICIOS, JSON.stringify(window.SEED_DATA.servicios));
    localStorage.setItem(STORAGE_KEYS.PROFESIONAL, JSON.stringify(window.SEED_DATA.profesional));
    localStorage.setItem(STORAGE_KEYS.TURNOS, JSON.stringify(window.SEED_DATA.turnos));
    localStorage.setItem(STORAGE_KEYS.CURSO, JSON.stringify(window.SEED_DATA.curso));
    localStorage.setItem(STORAGE_KEYS.INSCRIPCIONES, JSON.stringify(window.SEED_DATA.inscripcionesCurso));
    localStorage.setItem(STORAGE_KEYS.NEGOCIO, JSON.stringify(window.SEED_DATA.negocio));
    return true;
  }

  // ==========================================
  // SERVICIOS
  // ==========================================

  static async getServicios(soloActivos = false) {
    const servicios = this._getItem(STORAGE_KEYS.SERVICIOS, []);
    return soloActivos ? servicios.filter(s => s.activo) : servicios;
  }

  static async getServicioById(id) {
    const servicios = await this.getServicios();
    return servicios.find(s => s.id === id) || null;
  }

  static async saveServicio(servicioDto) {
    const servicios = await this.getServicios();
    const nuevo = {
      id: `srv-${Date.now()}`,
      nombre: servicioDto.nombre,
      categoria: servicioDto.categoria || "General",
      descripcion: servicioDto.descripcion || "",
      precio: Number(servicioDto.precio) || 0,
      duracionMinutos: Number(servicioDto.duracionMinutos) || 60,
      imagen: servicioDto.imagen || "assets/images/balayage_miel.png",
      destacado: !!servicioDto.destacado,
      activo: servicioDto.activo !== undefined ? servicioDto.activo : true
    };
    servicios.push(nuevo);
    this._setItem(STORAGE_KEYS.SERVICIOS, servicios);
    return nuevo;
  }


  static async updateServicio(id, servicioDto) {
    const servicios = await this.getServicios();
    const index = servicios.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Servicio ${id} no encontrado`);

    servicios[index] = {
      ...servicios[index],
      nombre: servicioDto.nombre ?? servicios[index].nombre,
      categoria: servicioDto.categoria ?? servicios[index].categoria,
      descripcion: servicioDto.descripcion ?? servicios[index].descripcion,
      precio: servicioDto.precio !== undefined ? Number(servicioDto.precio) : servicios[index].precio,
      duracionMinutos: servicioDto.duracionMinutos !== undefined ? Number(servicioDto.duracionMinutos) : servicios[index].duracionMinutos,
      imagen: servicioDto.imagen ?? servicios[index].imagen,
      destacado: servicioDto.destacado !== undefined ? !!servicioDto.destacado : servicios[index].destacado,
      activo: servicioDto.activo !== undefined ? !!servicioDto.activo : servicios[index].activo
    };
    this._setItem(STORAGE_KEYS.SERVICIOS, servicios);
    return servicios[index];
  }

  static async deleteServicio(id) {
    let servicios = await this.getServicios();
    servicios = servicios.filter(s => s.id !== id);
    this._setItem(STORAGE_KEYS.SERVICIOS, servicios);
    return true;
  }

  // ==========================================
  // PROFESIONAL (Mariano)
  // ==========================================

  static async getProfesional() {
    return this._getItem(STORAGE_KEYS.PROFESIONAL, window.SEED_DATA?.profesional || {
      id: "prof-1",
      nombre: "Mariano",
      titulo: "Estilista Profesional & Colorista",
      experiencia: "+15 Años de Experiencia"
    });
  }

  // ==========================================
  // NEGOCIO
  // ==========================================

  static async getNegocio() {
    return this._getItem(STORAGE_KEYS.NEGOCIO, window.SEED_DATA?.negocio || {});
  }

  static async updateNegocio(data) {
    const negocio = await this.getNegocio();
    const actualizado = { ...negocio, ...data };
    this._setItem(STORAGE_KEYS.NEGOCIO, actualizado);
    return actualizado;
  }

  // ==========================================
  // TURNOS / RESERVAS
  // ==========================================

  static async getTurnos(filtros = {}) {
    let turnos = this._getItem(STORAGE_KEYS.TURNOS, []);

    if (filtros.fecha) {
      turnos = turnos.filter(t => t.fecha === filtros.fecha);
    }
    if (filtros.estado && filtros.estado !== "todos") {
      turnos = turnos.filter(t => t.estado.toLowerCase() === filtros.estado.toLowerCase());
    }
    if (filtros.search) {
      const q = filtros.search.toLowerCase();
      turnos = turnos.filter(t =>
        (t.cliente?.nombre && t.cliente.nombre.toLowerCase().includes(q)) ||
        (t.cliente?.apellido && t.cliente.apellido.toLowerCase().includes(q)) ||
        (t.cliente?.telefono && t.cliente.telefono.includes(q)) ||
        (t.servicioNombre && t.servicioNombre.toLowerCase().includes(q))
      );
    }

    // Ordenar por fecha y hora descendente por defecto
    return turnos.sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora}`);
      const dateB = new Date(`${b.fecha}T${b.hora}`);
      return dateB - dateA;
    });
  }

  static async getTurnoById(id) {
    const turnos = await this.getTurnos();
    return turnos.find(t => t.id === id) || null;
  }

  static async saveTurno(reservaDto) {
    const turnos = this._getItem(STORAGE_KEYS.TURNOS, []);
    const profesional = await this.getProfesional();

    const nuevoTurno = {
      id: `trn-${Date.now().toString().slice(-6)}`,
      servicioId: reservaDto.servicioId,
      servicioNombre: reservaDto.servicioNombre,
      profesionalId: profesional.id,
      profesionalNombre: profesional.nombre,
      fecha: reservaDto.fecha,
      hora: reservaDto.hora,
      duracionMinutos: Number(reservaDto.duracionMinutos) || 60,
      precio: Number(reservaDto.precio) || 0,
      estado: "Pendiente", // Por defecto al reservar online
      cliente: {
        nombre: reservaDto.cliente.nombre,
        apellido: reservaDto.cliente.apellido,
        telefono: reservaDto.cliente.telefono,
        email: reservaDto.cliente.email,
        notas: reservaDto.cliente.notas || ""
      },
      creadoEn: new Date().toISOString()
    };

    turnos.push(nuevoTurno);
    this._setItem(STORAGE_KEYS.TURNOS, turnos);
    return nuevoTurno;
  }

  static async updateTurnoEstado(id, nuevoEstado) {
    const turnos = this._getItem(STORAGE_KEYS.TURNOS, []);
    const index = turnos.findIndex(t => t.id === id);
    if (index === -1) throw new Error(`Turno ${id} no encontrado`);

    turnos[index].estado = nuevoEstado;
    this._setItem(STORAGE_KEYS.TURNOS, turnos);
    return turnos[index];
  }

  static async deleteTurno(id) {
    let turnos = this._getItem(STORAGE_KEYS.TURNOS, []);
    turnos = turnos.filter(t => t.id !== id);
    this._setItem(STORAGE_KEYS.TURNOS, turnos);
    return true;
  }

  /**
   * Calcula los horarios disponibles para una fecha y duración dada
   */
  static async getDisponibilidad(fechaStr, duracionMinutos = 60) {
    const negocio = await this.getNegocio();
    const turnosDelDia = await this.getTurnos({ fecha: fechaStr });

    // Rango horario general (ej: 09:00 a 19:00)
    const [startH, startM] = (negocio.horaApertura || "09:00").split(":").map(Number);
    const [endH, endM] = (negocio.horaCierre || "19:00").split(":").map(Number);
    const intervalo = negocio.intervaloTurnosMinutos || 30;

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    // Convertir turnos existentes a rangos de minutos ocupados (excluyendo cancelados)
    const turnosActivos = turnosDelDia.filter(t => t.estado !== "Cancelado");
    const ocupados = turnosActivos.map(t => {
      const [h, m] = t.hora.split(":").map(Number);
      const inicio = h * 60 + m;
      const fin = inicio + (t.duracionMinutos || 60);
      return { inicio, fin };
    });

    const slots = [];

    for (let current = startTotal; current + duracionMinutos <= endTotal; current += intervalo) {
      const slotInicio = current;
      const slotFin = current + duracionMinutos;

      const hh = String(Math.floor(slotInicio / 60)).padStart(2, "0");
      const mm = String(slotInicio % 60).padStart(2, "0");
      const horaStr = `${hh}:${mm}`;

      // Comprobar colisión con turnos existentes
      const colisiona = ocupados.some(o => (slotInicio < o.fin && slotFin > o.inicio));

      slots.push({
        hora: horaStr,
        disponible: !colisiona
      });
    }

    return slots;
  }

  // ==========================================
  // CLIENTES (Generados a partir de los turnos)
  // ==========================================

  static async getClientes() {
    const turnos = await this.getTurnos();
    const clientesMap = new Map();

    turnos.forEach(t => {
      if (!t.cliente || !t.cliente.email) return;
      const key = (t.cliente.email || "").toLowerCase().trim();

      if (!clientesMap.has(key)) {
        clientesMap.set(key, {
          nombre: t.cliente.nombre,
          apellido: t.cliente.apellido,
          telefono: t.cliente.telefono,
          email: t.cliente.email,
          cantidadTurnos: 1,
          ultimoTurno: t.fecha,
          turnos: [t]
        });
      } else {
        const cliente = clientesMap.get(key);
        cliente.cantidadTurnos += 1;
        if (new Date(t.fecha) > new Date(cliente.ultimoTurno)) {
          cliente.ultimoTurno = t.fecha;
        }
        cliente.turnos.push(t);
      }
    });

    return Array.from(clientesMap.values()).sort((a, b) => b.cantidadTurnos - a.cantidadTurnos);
  }

  // ==========================================
  // CURSO & INSCRIPCIONES
  // ==========================================

  static async getCursoInfo() {
    return this._getItem(STORAGE_KEYS.CURSO, window.SEED_DATA?.curso || {});
  }

  static async getInscripciones() {
    const inscripciones = this._getItem(STORAGE_KEYS.INSCRIPCIONES, []);
    return inscripciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  static async saveInscripcion(datos) {
    const inscripciones = this._getItem(STORAGE_KEYS.INSCRIPCIONES, []);
    const nueva = {
      id: `ins-${Date.now().toString().slice(-6)}`,
      cursoId: "cur-1",
      nombre: datos.nombre,
      apellido: datos.apellido || "",
      telefono: datos.telefono,
      email: datos.email,
      fecha: new Date().toISOString(),
      estado: "Pendiente" // Pendiente, Contactado, Inscripto
    };

    inscripciones.push(nueva);
    this._setItem(STORAGE_KEYS.INSCRIPCIONES, inscripciones);
    return nueva;
  }

  static async updateInscripcionEstado(id, nuevoEstado) {
    const inscripciones = this._getItem(STORAGE_KEYS.INSCRIPCIONES, []);
    const index = inscripciones.findIndex(i => i.id === id);
    if (index === -1) throw new Error(`Inscripción ${id} no encontrada`);

    inscripciones[index].estado = nuevoEstado;
    this._setItem(STORAGE_KEYS.INSCRIPCIONES, inscripciones);
    return inscripciones[index];
  }

  static async deleteInscripcion(id) {
    let inscripciones = this._getItem(STORAGE_KEYS.INSCRIPCIONES, []);
    inscripciones = inscripciones.filter(i => i.id !== id);
    this._setItem(STORAGE_KEYS.INSCRIPCIONES, inscripciones);
    return true;
  }

  // ==========================================
  // DASHBOARD KPIS
  // ==========================================

  static async getDashboardStats() {
    const turnos = await this.getTurnos();
    const clientes = await this.getClientes();
    const inscripciones = await this.getInscripciones();

    const hoyStr = new Date().toISOString().split("T")[0];

    const turnosHoy = turnos.filter(t => t.fecha === hoyStr && t.estado !== "Cancelado").length;
    const turnosPendientes = turnos.filter(t => t.estado === "Pendiente").length;
    const turnosCompletados = turnos.filter(t => t.estado === "Completado").length;

    const ingresosEstimados = turnos
      .filter(t => t.estado === "Confirmado" || t.estado === "Completado")
      .reduce((sum, t) => sum + (Number(t.precio) || 0), 0);

    return {
      turnosHoy,
      turnosPendientes,
      turnosCompletados,
      totalClientes: clientes.length,
      ingresosEstimados,
      inscripcionesCurso: inscripciones.length
    };
  }
}

// Inicialización automática
if (typeof window !== "undefined") {
  window.StorageService = StorageService;
  document.addEventListener("DOMContentLoaded", () => {
    StorageService.init();
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = StorageService;
}
