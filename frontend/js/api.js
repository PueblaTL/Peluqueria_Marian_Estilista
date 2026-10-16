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
      const statusDetail = res.statusText ? `: ${res.statusText}` : '';
      const errorMsg = data?.message || `Error HTTP ${res.status}${statusDetail}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.type = data?.type || (res.status === 401 ? 'auth' : (res.status === 403 ? 'unverified_email' : (res.status >= 500 ? 'server_error' : 'error')));
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    // Si la API no está disponible (ej: fallo de conexión de red o servidor apagado)
    if (err.name === "TypeError" && err.message && err.message.includes("fetch")) {
      console.warn(`[API] El backend no respondió en ${url}.`);
      const netErr = new Error("No pudimos comunicarnos con el servidor. Verificá tu conexión e intentá nuevamente.");
      netErr.status = 0;
      netErr.type = "network_error";
      throw netErr;
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

async function apiForgotPassword(email) {
  const res = await requestApi("/auth/forgot-password.php", {
    method: "POST",
    body: { email }
  });
  return res;
}

async function apiValidateResetToken(token) {
  const res = await requestApi(`/auth/reset-password.php?token=${encodeURIComponent(token)}`, {
    method: "GET"
  });
  return res;
}

async function apiResetPassword(token, password, confirmPassword) {
  const res = await requestApi("/auth/reset-password.php", {
    method: "POST",
    body: { token, password, confirm_password: confirmPassword }
  });
  return res;
}


// ==============================================================================
// 2. SERVICIOS
// ==============================================================================

async function apiGetServicios(soloActivos = true) {
  try {
    const endpoint = soloActivos ? "/servicios/list.php" : "/servicios/list.php?todos=1";
    const res = await requestApi(endpoint, { method: "GET" });
    const items = res.data || [];
    return items.map(s => {
      const dur = s.duracion_minutos !== undefined ? Number(s.duracion_minutos) : Number(s.duracionMinutos || s.duracion || 60);
      const nom = (s.nombre || '').toLowerCase();
      let precioTxt = s.precioTexto || s.precio_texto;
      if (!precioTxt) {
        if (nom.includes('novia')) {
          precioTxt = 'Desde $80.000';
        } else if (nom === 'peinados para eventos') {
          precioTxt = 'Desde $30.000';
        } else if (nom.includes('alisado') || nom.includes('mechas')) {
          precioTxt = '$150.000 a $180.000';
        } else {
          precioTxt = '$' + Number(s.precio || 0).toLocaleString("es-AR");
        }
      }
      return {
        ...s,
        precioTexto: precioTxt,
        precio_texto: precioTxt,
        duracion: dur,
        duracion_minutos: dur,
        duracionMinutos: dur
      };
    });
  } catch (err) {
    console.warn("[API] Fallback a datos locales de servicios:", err.message);
    if (window.StorageService) {
      const locales = await window.StorageService.getServicios(soloActivos);
      return locales.map(s => {
        const dur = s.duracionMinutos !== undefined ? Number(s.duracionMinutos) : Number(s.duracion_minutos || s.duracion || 60);
        const nom = (s.nombre || '').toLowerCase();
        let precioTxt = s.precioTexto || s.precio_texto;
        if (!precioTxt) {
          if (nom.includes('novia')) precioTxt = 'Desde $80.000';
          else if (nom === 'peinados para eventos') precioTxt = 'Desde $30.000';
          else precioTxt = '$' + Number(s.precio || 0).toLocaleString("es-AR");
        }
        return {
          ...s,
          precioTexto: precioTxt,
          duracion: dur,
          duracionMinutos: dur,
          duracion_minutos: dur
        };
      });
    }
    return window.SEED_DATA?.servicios || [];
  }
}

async function apiGetServicioById(id) {
  const res = await requestApi(`/servicios/get.php?id=${id}`, { method: "GET" });
  if (res.data) {
    const dur = res.data.duracion_minutos !== undefined ? Number(res.data.duracion_minutos) : Number(res.data.duracionMinutos || res.data.duracion || 60);
    const nom = (res.data.nombre || '').toLowerCase();
    let precioTxt = res.data.precioTexto || res.data.precio_texto;
    if (!precioTxt) {
      if (nom.includes('novia')) precioTxt = 'Desde $80.000';
      else if (nom === 'peinados para eventos') precioTxt = 'Desde $30.000';
      else if (nom.includes('alisado') || nom.includes('mechas')) precioTxt = '$150.000 a $180.000';
      else precioTxt = '$' + Number(res.data.precio || 0).toLocaleString("es-AR");
    }
    res.data.precioTexto = precioTxt;
    res.data.precio_texto = precioTxt;
    res.data.duracion = dur;
    res.data.duracion_minutos = dur;
    res.data.duracionMinutos = dur;
  }
  return res.data;
}

async function apiCreateServicio(datosServicio) {
  const payload = {
    ...datosServicio,
    duracion_minutos: datosServicio.duracion_minutos || datosServicio.duracionMinutos || 60,
    duracionMinutos: datosServicio.duracionMinutos || datosServicio.duracion_minutos || 60
  };
  const res = await requestApi("/servicios/create.php", {
    method: "POST",
    body: payload
  });
  return res.data;
}

async function apiUpdateServicio(id, datosServicio) {
  const payload = {
    id: Number(id),
    ...datosServicio
  };
  if (datosServicio.duracionMinutos !== undefined || datosServicio.duracion_minutos !== undefined) {
    const dur = datosServicio.duracion_minutos !== undefined ? datosServicio.duracion_minutos : datosServicio.duracionMinutos;
    payload.duracion_minutos = Number(dur);
    payload.duracionMinutos = Number(dur);
  }
  const res = await requestApi("/servicios/update.php", {
    method: "POST",
    body: payload
  });
  return res.data;
}

async function apiDeleteServicio(id) {
  const res = await requestApi("/servicios/delete.php", {
    method: "POST",
    body: { id: Number(id) }
  });
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
  if (filtros.estado && filtros.estado !== "todos") params.append("estado", filtros.estado);
  if (filtros.search) params.append("search", filtros.search);
  const qStr = params.toString();
  if (qStr) query = `?${qStr}`;

  try {
    const res = await requestApi(`/reservas/list.php${query}`, { method: "GET" });
    const items = res.data || [];
    return items.map(t => {
      const dur = t.duracion_minutos !== undefined ? Number(t.duracion_minutos) : Number(t.duracionMinutos || 60);
      return {
        ...t,
        duracion_minutos: dur,
        duracionMinutos: dur,
        servicioNombre: t.servicio_nombre || t.servicioNombre || "Servicio",
        profesionalNombre: t.profesional_nombre || t.profesionalNombre || "Marian"
      };
    });
  } catch (err) {
    console.warn("[API] Fallback a datos locales de reservas:", err.message);
    if (window.StorageService) {
      return window.StorageService.getTurnos(filtros);
    }
    return [];
  }
}

async function apiCancelarReserva(id) {
  const res = await requestApi("/reservas/delete.php", {
    method: "POST",
    body: { id }
  });
  return res.data;
}

async function apiActualizarEstadoReserva(id, estado) {
  // Normalizar el estado antes de enviarlo para que el mapa del backend funcione
  const estadoNorm = String(estado).toUpperCase();
  const res = await requestApi("/reservas/update.php", {
    method: "POST",
    body: { id, estado: estadoNorm }
  });
  return res.data;
}

// ==============================================================================
// 6. ESTADÍSTICAS DEL DASHBOARD (ADMIN)
// ==============================================================================

async function apiGetStats() {
  try {
    const res = await requestApi("/reservas/stats.php", { method: "GET" });
    return res.data || {};
  } catch (err) {
    console.warn("[API] No se pudieron obtener las estadísticas desde el servidor:", err.message);
    return null; // null indica al caller que use fallback local
  }
}

// ==============================================================================
// 7. CLIENTES (ADMIN)
// ==============================================================================

async function apiGetClientes() {
  try {
    const res = await requestApi("/usuarios/list.php", { method: "GET" });
    return res.data || [];
  } catch (err) {
    console.warn("[API] No se pudieron obtener los clientes desde el servidor:", err.message);
    return null; // null indica al caller que use fallback local
  }
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
  static async create(payload) {
    return apiCreateServicio(payload);
  }
  static async update(id, payload) {
    return apiUpdateServicio(id, payload);
  }
  static async delete(id) {
    return apiDeleteServicio(id);
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

// ==============================================================================
// 5. CURSO & INSCRIPCIONES
// ==============================================================================

async function apiGetInscripciones() {
  const res = await requestApi("/inscripciones/list.php", { method: "GET" });
  return res.data || [];
}

async function apiCreateInscripcion(datosInscripcion) {
  const res = await requestApi("/inscripciones/create.php", {
    method: "POST",
    body: datosInscripcion
  });
  return res.data;
}

async function apiUpdateInscripcionEstado(id, nuevoEstado, fechaFinalizacion = null) {
  const res = await requestApi("/inscripciones/update_estado.php", {
    method: "POST",
    body: { id: Number(id), estado: nuevoEstado, fecha_finalizacion: fechaFinalizacion }
  });
  return res.data;
}

async function apiDeleteInscripcion(id) {
  const res = await requestApi("/inscripciones/delete.php", {
    method: "POST",
    body: { id: Number(id) }
  });
  return res.data;
}

// Exportación global en el objeto window del navegador
if (typeof window !== "undefined") {
  window.API_BASE = API_BASE;
  window.requestApi = requestApi;
  window.apiRegister = apiRegister;
  window.apiLogin = apiLogin;
  window.apiLogout = apiLogout;
  window.apiGetCurrentUser = apiGetCurrentUser;
  window.apiForgotPassword = apiForgotPassword;
  window.apiValidateResetToken = apiValidateResetToken;
  window.apiResetPassword = apiResetPassword;
  window.apiGetServicios = apiGetServicios;
  window.apiGetServicioById = apiGetServicioById;
  window.apiCreateServicio = apiCreateServicio;
  window.apiUpdateServicio = apiUpdateServicio;
  window.apiDeleteServicio = apiDeleteServicio;
  window.apiGetProfesionales = apiGetProfesionales;
  window.apiGetProfesionalDefault = apiGetProfesionalDefault;
  window.apiGetDisponibilidad = apiGetDisponibilidad;
  window.apiCrearReserva = apiCrearReserva;
  window.apiObtenerReservas = apiObtenerReservas;
  window.apiCancelarReserva = apiCancelarReserva;
  window.apiActualizarEstadoReserva = apiActualizarEstadoReserva;
  window.apiGetStats = apiGetStats;
  window.apiGetClientes = apiGetClientes;
  window.apiGetInscripciones = apiGetInscripciones;
  window.apiCreateInscripcion = apiCreateInscripcion;
  window.apiUpdateInscripcionEstado = apiUpdateInscripcionEstado;
  window.apiDeleteInscripcion = apiDeleteInscripcion;

  // Clases adaptadoras
  window.ServicioService = ServicioService;
  window.TurnoService = TurnoService;
}

