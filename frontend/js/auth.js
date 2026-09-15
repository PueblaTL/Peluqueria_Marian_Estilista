/**
 * auth.js - Controlador de Estado de Autenticación, Navbar Dinámico y Páginas de Auth
 * Marian Estilista
 */

// ==============================================================================
// 1. GESTIÓN DEL NAVBAR Y ESTADO DE SESIÓN GLOBAL
// ==============================================================================

async function updateNavbarAuth() {
  const headerActions = document.querySelector(".header-actions");
  if (!headerActions) return;

  // Determinar ruta relativa a páginas según la ubicación actual
  const isInsidePages = window.location.pathname.includes("/pages/");
  const pathPrefix = isInsidePages ? "" : "pages/";
  const loginUrl = `${pathPrefix}login.html`;
  const misReservasUrl = `${pathPrefix}mis-reservas.html`;
  const adminUrl = `${pathPrefix}admin.html`;

  let currentUser = null;
  try {
    currentUser = await window.apiGetCurrentUser();
  } catch (e) {
    currentUser = null;
  }

  // Buscar si ya existe el contenedor de autenticación en el header
  let authContainer = document.getElementById("navbar-auth-container");
  if (!authContainer) {
    authContainer = document.createElement("div");
    authContainer.id = "navbar-auth-container";
    // Insertarlo antes del botón mobile-toggle si existe, o al final
    const mobileToggle = headerActions.querySelector(".mobile-toggle");
    if (mobileToggle) {
      headerActions.insertBefore(authContainer, mobileToggle);
    } else {
      headerActions.appendChild(authContainer);
    }
  }

  if (currentUser) {
    // Usuario Autenticado
    const nombre = currentUser.nombre || "Clienta";
    const esAdmin = currentUser.rol === "ADMIN";

    authContainer.innerHTML = `
      <div class="user-nav-dropdown" id="user-nav-dropdown">
        <button type="button" class="user-nav-trigger" id="user-nav-trigger" aria-expanded="false">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>${nombre}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <div class="user-nav-menu" id="user-nav-menu">
          <div class="user-nav-menu-header">
            <div class="user-nav-menu-name">${currentUser.nombre} ${currentUser.apellido || ""}</div>
            <div class="user-nav-menu-email">${currentUser.email} (${currentUser.rol})</div>
          </div>

          <a href="${misReservasUrl}" class="user-nav-menu-item">
            <span>📅 Mis Reservas</span>
          </a>

          ${esAdmin ? `
            <a href="${adminUrl}" class="user-nav-menu-item" style="color: #a17522; font-weight: 700;">
              <span>⚡ Panel Admin</span>
            </a>
          ` : ''}

          <button type="button" class="user-nav-menu-item logout" id="btn-navbar-logout">
            <span>🚪 Cerrar Sesión</span>
          </button>
        </div>
      </div>
    `;

    // Eventos del dropdown
    const dropdown = document.getElementById("user-nav-dropdown");
    const trigger = document.getElementById("user-nav-trigger");
    const btnLogout = document.getElementById("btn-navbar-logout");

    if (trigger && dropdown) {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("active");
        trigger.setAttribute("aria-expanded", dropdown.classList.contains("active"));
      });

      document.addEventListener("click", () => {
        dropdown.classList.remove("active");
        trigger.setAttribute("aria-expanded", "false");
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener("click", async () => {
        try {
          await window.apiLogout();
          if (typeof window.showToast === "function") {
            window.showToast("Sesión cerrada correctamente.", "info");
          }
          setTimeout(() => {
            window.location.href = isInsidePages ? "../index.html" : "index.html";
          }, 600);
        } catch (err) {
          console.error("Error al cerrar sesión:", err);
          window.location.reload();
        }
      });
    }

  } else {
    // Usuario NO Autenticado
    authContainer.innerHTML = `
      <a href="${loginUrl}" class="auth-nav-link" id="nav-login-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <polyline points="10 17 15 12 10 7"></polyline>
          <line x1="15" y1="12" x2="3" y2="12"></line>
        </svg>
        <span>Iniciar sesión</span>
      </a>
    `;
  }
}

// ==============================================================================
// 2. LÓGICA DE LA PÁGINA LOGIN (login.html)
// ==============================================================================

async function initLoginPage() {
  // Si ya está autenticado, redirigir
  const user = await window.apiGetCurrentUser();
  if (user) {
    window.location.href = user.rol === "ADMIN" ? "admin.html" : "mis-reservas.html";
    return;
  }

  const form = document.getElementById("form-login");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const submitBtn = document.getElementById("btn-submit-login");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      window.showToast?.("Por favor completa tu email y contraseña.", "warning");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Verificando...";

    try {
      const usuario = await window.apiLogin(email, password);
      window.showToast?.(`¡Bienvenida ${usuario.nombre}!`, "success");

      // Redirigir según rol o parámetro de retorno
      setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get("redirect");
        if (redirect) {
          window.location.href = redirect;
        } else if (usuario.rol === "ADMIN") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "reservas.html";
        }
      }, 700);
    } catch (err) {
      console.error("Error en login:", err);
      const msg = err.data?.message || err.message || "Credenciales incorrectas.";
      window.showToast?.(msg, "danger");
      submitBtn.disabled = false;
      submitBtn.textContent = "Iniciar Sesión";
    }
  });
}

// ==============================================================================
// 3. LÓGICA DE LA PÁGINA REGISTRO (registro.html)
// ==============================================================================

async function initRegisterPage() {
  const user = await window.apiGetCurrentUser();
  if (user) {
    window.location.href = "reservas.html";
    return;
  }

  const form = document.getElementById("form-registro");
  const submitBtn = document.getElementById("btn-submit-registro");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("reg-nombre")?.value.trim() || "";
    const apellido = document.getElementById("reg-apellido")?.value.trim() || "";
    const email = document.getElementById("reg-email")?.value.trim() || "";
    const telefono = document.getElementById("reg-telefono")?.value.trim() || "";
    const password = document.getElementById("reg-password")?.value || "";
    const confirmPassword = document.getElementById("reg-confirm-password")?.value || "";

    if (!nombre || !apellido || !email || !password) {
      window.showToast?.("Por favor completa los campos requeridos.", "warning");
      return;
    }

    if (password.length < 6) {
      window.showToast?.("La contraseña debe tener al menos 6 caracteres.", "warning");
      return;
    }

    if (password !== confirmPassword) {
      window.showToast?.("Las contraseñas ingresadas no coinciden.", "danger");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creando cuenta...";

    try {
      const nuevoUsuario = await window.apiRegister({
        nombre,
        apellido,
        email,
        telefono,
        password,
        confirm_password: confirmPassword
      });

      window.showToast?.(`✨ ¡Cuenta creada exitosamente! Bienvenida ${nuevoUsuario.nombre}.`, "success");

      setTimeout(() => {
        window.location.href = "reservas.html";
      }, 800);
    } catch (err) {
      console.error("Error en registro:", err);
      const msg = err.data?.message || err.message || "Error al registrar la cuenta.";
      window.showToast?.(msg, "danger");
      submitBtn.disabled = false;
      submitBtn.textContent = "Registrarse e Iniciar Sesión";
    }
  });
}

// ==============================================================================
// 4. LÓGICA DE LA PÁGINA MIS RESERVAS (mis-reservas.html)
// ==============================================================================

async function initMisReservasPage() {
  const container = document.getElementById("reservas-list-container");
  const greeting = document.getElementById("user-greeting");
  if (!container) return;

  const user = await window.apiGetCurrentUser();
  if (!user) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: #ffffff; border-radius: 16px; border: 1px solid #e8decb;">
        <h3 style="font-family: var(--font-serif); margin-bottom: 12px; color: #2b2219;">Inicia sesión para ver tus reservas</h3>
        <p style="color: #7a6e62; max-width: 480px; margin: 0 auto 24px;">Debes estar autenticada para acceder a tu historial de citas y gestionar tus turnos.</p>
        <a href="login.html?redirect=mis-reservas.html" class="btn btn-primary btn-md">Iniciar Sesión</a>
      </div>
    `;
    return;
  }

  if (greeting) {
    greeting.textContent = `Hola ${user.nombre}, aquí puedes consultar y gestionar tus turnos en Marian Estilista.`;
  }

  try {
    const reservas = await window.apiObtenerReservas();

    if (!reservas || reservas.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: #ffffff; border-radius: 16px; border: 1px solid #e8decb;">
          <h3 style="font-family: var(--font-serif); margin-bottom: 12px; color: #2b2219;">Aún no tienes turnos reservados</h3>
          <p style="color: #7a6e62; margin-bottom: 24px;">Agenda tu primera cita de coloración, balayage o alisado con Mariano.</p>
          <a href="reservas.html" class="btn btn-primary btn-md">+ Reservar mi Turno</a>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    reservas.forEach(reserva => {
      const card = document.createElement("div");
      card.className = "reserva-client-card";

      const [y, m, d] = (reserva.fecha || "").split("-").map(Number);
      const fechaFormatted = reserva.fecha
        ? new Date(y, m - 1, d).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : reserva.fecha;

      const estadoClass = `status-${(reserva.estado || "pendiente").toLowerCase()}`;
      const puedeCancelar = reserva.estado !== "CANCELADA" && reserva.estado !== "COMPLETADA";

      card.innerHTML = `
        <div class="reserva-card-top">
          <div>
            <span style="font-size: 0.78rem; font-weight: 700; color: #a17522; text-transform: uppercase;">
              ${reserva.servicio_categoria || 'Servicio'}
            </span>
            <h3 class="reserva-service-name">${reserva.servicio_nombre || 'Servicio Personalizado'}</h3>
          </div>
          <span class="reserva-badge-status ${estadoClass}">${reserva.estado}</span>
        </div>

        <div class="reserva-meta-list">
          <div class="reserva-meta-item">
            <span>📅</span>
            <strong>${fechaFormatted}</strong>
          </div>
          <div class="reserva-meta-item">
            <span>⏰</span>
            <span>${reserva.hora} hs (${reserva.duracion_minutos || reserva.duracionMinutos || 60} min)</span>
          </div>
          <div class="reserva-meta-item">
            <span>💇‍♂️</span>
            <span>Profesional: ${reserva.profesional_nombre || 'Mariano'}</span>
          </div>
          <div class="reserva-meta-item">
            <span>💰</span>
            <span>Valor: $${Number(reserva.precio).toLocaleString("es-AR")}</span>
          </div>
          ${reserva.observaciones ? `
            <div class="reserva-meta-item" style="color: #7a6e62; font-style: italic;">
              <span>📝</span>
              <span>"${reserva.observaciones}"</span>
            </div>
          ` : ''}
        </div>

        ${puedeCancelar ? `
          <button type="button" class="reserva-cancel-btn" data-id="${reserva.id}">
            Cancelar Cita
          </button>
        ` : ''}
      `;

      // Evento de cancelación
      const cancelBtn = card.querySelector(".reserva-cancel-btn");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", async () => {
          if (confirm(`¿Estás segura de que deseas cancelar tu turno para "${reserva.servicio_nombre}" el día ${fechaFormatted}?`)) {
            cancelBtn.disabled = true;
            cancelBtn.textContent = "Cancelando...";
            try {
              await window.apiCancelarReserva(reserva.id);
              window.showToast?.("Reserva cancelada correctamente.", "info");
              await initMisReservasPage();
            } catch (err) {
              console.error("Error al cancelar:", err);
              window.showToast?.(err.message || "No se pudo cancelar la reserva.", "danger");
              cancelBtn.disabled = false;
              cancelBtn.textContent = "Cancelar Cita";
            }
          }
        });
      }

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Error al cargar reservas:", err);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #b33939;">
        Ocurrió un error al consultar tus reservas. Por favor recarga la página.
      </div>
    `;
  }
}

// Ejecutar automáticamente la actualización del Navbar en todas las páginas
document.addEventListener("DOMContentLoaded", () => {
  updateNavbarAuth();
});

// Exportación global
if (typeof window !== "undefined") {
  window.updateNavbarAuth = updateNavbarAuth;
  window.initLoginPage = initLoginPage;
  window.initRegisterPage = initRegisterPage;
  window.initMisReservasPage = initMisReservasPage;
}
