/**
 * api.js - Cliente de Comunicación REST API para Marian Estilista
 * Conecta el frontend Vanilla JS con el backend en PHP puro + MySQL
 */

// Detección dinámica de la URL base del Backend API
function getApiBaseUrl() {
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  // Si se ejecuta en XAMPP/Laragon dentro de una subcarpeta (ej: /marian-estilista/frontend/...)
  const match = pathname.match(/^(.*?\/marian-estilista|.*?\/peluqueria-portal)/i);
  if (match) {
    return `${origin}${match[1]}/backend/api`;
  }

  // Si se ejecuta mediante Live Server (puerto 5500, etc.) o desarrollo local
  if (window.location.port && window.location.port !== "80" && window.location.port !== "443") {
    // Por defecto asume backend en Apache local estándar (localhost/marian-estilista/backend/api)
    // o ruta relativa si se sirve directamente
    return `http://localhost/marian-estilista/backend/api`;
  }

  // Ruta relativa por defecto
  return `${origin}/backend/api`;
}

const API_BASE = getApiBaseUrl();

/**
 * Función genérica de petición HTTP con soporte para credenciales de sesión y JSON
 */
async function requestApi(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options.headers || {})
    },
    credentials: "include" // CRÍTICO: envía y recibe cookies de sesión PHP
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.message || `Error HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    // Si la API no está disponible (ej: MySQL o Apache apagados)
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      console.warn(`[API] El backend no respondió en ${url}.`);
      throw new Error("No se pudo conectar con el servidor backend. Verifique que Apache y MySQL estén iniciados.");
    }
    throw err;
  }
}

// ==============================================================================
// 1. AUTENTICACIÓN Y USUARIOS
// ==============================================================================

async function apiRegister(datosRegistro) {
  const res = await requestApi("/auth/register.php", {
    method: "POST",
    body: datosRegistro
  });
  return res.data;
}

async function apiLogin(email, password) {
  const res = await requestApi("/auth/login.php", {
    method: "POST",
    body: { email, password }
  });
  return res.data;
}

async function apiLogout() {
  const res = await requestApi("/auth/logout.php", {
    method: "POST"
  });
  return res;
}

async function apiGetCurrentUser() {
  try {
    const res = await requestApi("/auth/me.php", { method: "GET" });
    return res.data;
  } catch (e) {
    return null; // Sesión no iniciada
  }
}

// ==============================================================================
// 2. SERVICIOS
// ==============================================================================

async function apiGetServicios(soloActivos = true) {
  try {
    const endpoint = soloActivos ? "/servicios/list.php" : "/servicios/list.php?todos=1";
    const res = await requestApi(endpoint, { method: "GET" });
    return res.data || [];
  } catch (err) {
    console.warn("[API] Fallback a datos locales de servicios:", err.message);
    if (window.StorageService) {
      return window.StorageService.getServicios(soloActivos);
    }
    return window.SEED_DATA?.servicios || [];
  }
}

async function apiGetServicioById(id) {
  const res = await requestApi(`/servicios/get.php?id=${id}`, { method: "GET" });
  return res.data;
}

// ==============================================================================
// 3. PROFESIONALES
// ==============================================================================

async function apiGetProfesionales() {
  try {
    const res = await requestApi("/profesionales/list.php", { method: "GET" });
    return res.data || [];
  } catch (err) {
    console.warn("[API] Fallback a datos locales de profesionales:", err.message);
    if (window.StorageService) {
      const prof = await window.StorageService.getProfesional();
      return [prof];
    }
    return [window.SEED_DATA?.profesional];
  }
}

async function apiGetProfesionalDefault() {
  try {
    const res = await requestApi("/profesionales/get.php", { method: "GET" });
    return res.data;
  } catch (err) {
    return window.SEED_DATA?.profesional || { id: 1, nombre: "Mariano", especialidad: "Colorimetría y Balayage" };
  }
}

// ==============================================================================
// 4. RESERVAS (TURNOS)
// ==============================================================================

async function apiGetDisponibilidad(fecha, duracionMinutos = 60, profesionalId = 1) {
  try {
    const endpoint = `/reservas/disponibilidad.php?fecha=${encodeURIComponent(fecha)}&duracion=${duracionMinutos}&profesional_id=${profesionalId}`;
    const res = await requestApi(endpoint, { method: "GET" });
    return res.data || [];
  } catch (err) {
    console.warn("[API] Fallback a cálculo local de disponibilidad:", err.message);
    if (window.StorageService) {
      return window.StorageService.getDisponibilidad(fecha, duracionMinutos);
    }
    return [];
  }
}

async function apiCrearReserva(datosReserva) {
  const res = await requestApi("/reservas/create.php", {
    method: "POST",
    body: datosReserva
  });
  return res.data;
}

async function apiObtenerReservas(filtros = {}) {
  let query = "";
  const params = new URLSearchParams();
  if (filtros.fecha) params.append("fecha", filtros.fecha);
  if (filtros.estado) params.append("estado", filtros.estado);
  if (filtros.search) params.append("search", filtros.search);
  const qStr = params.toString();
  if (qStr) query = `?${qStr}`;

  const res = await requestApi(`/reservas/list.php${query}`, { method: "GET" });
  return res.data || [];
}

async function apiCancelarReserva(id) {
  const res = await requestApi("/reservas/delete.php", {
    method: "POST",
    body: { id }
  });
  return res.data;
}

async function apiActualizarEstadoReserva(id, estado) {
  const res = await requestApi("/reservas/update.php", {
    method: "POST",
    body: { id, estado }
  });
  return res.data;
}

// ==============================================================================
// 5. COMPATIBILIDAD CON CÓDIGO EXISTENTE (ServicioService, TurnoService)
// ==============================================================================
class ServicioService {
  static async getAll(soloActivos = false) {
    return apiGetServicios(soloActivos);
  }
  static async getById(id) {
    return apiGetServicioById(id);
  }
}

class TurnoService {
  static async getAll(filtros = {}) {
    return apiObtenerReservas(filtros);
  }
  static async create(reservaDto) {
    return apiCrearReserva(reservaDto);
  }
  static async updateEstado(id, nuevoEstado) {
    return apiActualizarEstadoReserva(id, nuevoEstado);
  }
  static async delete(id) {
    return apiCancelarReserva(id);
  }
  static async getDisponibilidad(fechaStr, duracionMinutos) {
    return apiGetDisponibilidad(fechaStr, duracionMinutos);
  }
}

// Exportación global en el objeto window del navegador
if (typeof window !== "undefined") {
  window.API_BASE = API_BASE;
  window.requestApi = requestApi;
  window.apiRegister = apiRegister;
  window.apiLogin = apiLogin;
  window.apiLogout = apiLogout;
  window.apiGetCurrentUser = apiGetCurrentUser;
  window.apiGetServicios = apiGetServicios;
  window.apiGetServicioById = apiGetServicioById;
  window.apiGetProfesionales = apiGetProfesionales;
  window.apiGetProfesionalDefault = apiGetProfesionalDefault;
  window.apiGetDisponibilidad = apiGetDisponibilidad;
  window.apiCrearReserva = apiCrearReserva;
  window.apiObtenerReservas = apiObtenerReservas;
  window.apiCancelarReserva = apiCancelarReserva;
  window.apiActualizarEstadoReserva = apiActualizarEstadoReserva;

  // Clases adaptadoras
  window.ServicioService = ServicioService;
  window.TurnoService = TurnoService;
}
