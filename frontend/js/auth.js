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
  // 1. Detección de parámetros de verificación de correo o errores en URL
  const urlParams = new URLSearchParams(window.location.search);
  const verified = urlParams.get("verified");
  const verifyError = urlParams.get("verify_error");

  if (verified === "1") {
    if (typeof window.showAlertModal === "function") {
      window.showAlertModal({
        title: "✓ ¡Correo verificado correctamente!",
        message: "¡Correo verificado correctamente!\nTu cuenta ya está activa. Ahora puedes iniciar sesión.",
        type: "success",
        buttonText: "Entendido"
      });
    } else {
      window.showToast?.("¡Correo verificado correctamente! Ya puedes iniciar sesión.", "success");
    }
    // Limpiar parámetros de la URL sin recargar para que no vuelva a saltar si refresca
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (verifyError) {
    let title = "⚠ Atención";
    let message = "Ocurrió un inconveniente con el enlace de activación.";
    let type = "warning";

    if (verifyError === "expired") {
      title = "⚠ Enlace vencido";
      message = "El enlace de verificación ha vencido. Solicita un nuevo correo de verificación a continuación.";
    } else if (verifyError === "already_verified") {
      title = "✓ Correo ya verificado";
      message = "Este correo ya fue verificado previamente. Ya podés iniciar sesión.";
      type = "success";
    } else {
      title = "⚠ Enlace no válido";
      message = "Este enlace de verificación no es válido o ya fue utilizado.";
    }

    if (typeof window.showAlertModal === "function") {
      window.showAlertModal({
        title,
        message,
        type,
        buttonText: "Entendido"
      });
    } else {
      window.showToast?.(message, type);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 2. Si ya está autenticado, redirigir
  const user = await window.apiGetCurrentUser();
  if (user) {
    window.location.href = user.rol === "ADMIN" ? "admin.html" : "mis-reservas.html";
    return;
  }

  const form = document.getElementById("form-login");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const submitBtn = document.getElementById("btn-submit-login");

  // Paneles de vista Login vs Recuperación
  const loginPanel = document.getElementById("login-view-panel");
  const forgotPanel = document.getElementById("forgot-view-panel");
  const linkForgot = document.getElementById("link-forgot-password");
  const btnBackLogin = document.getElementById("btn-back-to-login");
  const linkReturnLogin = document.getElementById("link-return-login");
  const formForgot = document.getElementById("form-forgot-password");
  const forgotEmailInput = document.getElementById("forgot-email");
  const btnSubmitForgot = document.getElementById("btn-submit-forgot");
  const forgotFeedback = document.getElementById("forgot-feedback-container");

  // Toggle para mostrar panel de recuperación de contraseña
  if (linkForgot && loginPanel && forgotPanel) {
    linkForgot.addEventListener("click", (e) => {
      e.preventDefault();
      loginPanel.style.display = "none";
      forgotPanel.style.display = "block";
      if (emailInput && forgotEmailInput && emailInput.value) {
        forgotEmailInput.value = emailInput.value.trim();
      }
      if (forgotFeedback) forgotFeedback.style.display = "none";
      if (forgotEmailInput) forgotEmailInput.focus();
    });
  }

  const showLoginView = (e) => {
    if (e) e.preventDefault();
    if (loginPanel && forgotPanel) {
      forgotPanel.style.display = "none";
      loginPanel.style.display = "block";
      if (emailInput) emailInput.focus();
    }
  };

  if (btnBackLogin) btnBackLogin.addEventListener("click", showLoginView);
  if (linkReturnLogin) linkReturnLogin.addEventListener("click", showLoginView);

  // Procesamiento del formulario de recuperación
  if (formForgot) {
    formForgot.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = forgotEmailInput ? forgotEmailInput.value.trim() : "";
      if (!email) {
        window.showAlertModal?.({
          title: "⚠ Ingresá tu correo",
          message: "Ingresá tu correo electrónico para que podamos enviarte las instrucciones.",
          type: "warning",
          buttonText: "Entendido"
        });
        return;
      }

      if (btnSubmitForgot) {
        btnSubmitForgot.disabled = true;
        btnSubmitForgot.textContent = "Enviando...";
      }

      try {
        const res = await window.apiForgotPassword(email);
        const msg = res?.message || "Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.";
        if (forgotFeedback) {
          forgotFeedback.style.display = "block";
          forgotFeedback.textContent = "✓ " + msg;
        }
        if (typeof window.showAlertModal === "function") {
          window.showAlertModal({
            title: "✓ Solicitud Recibida",
            message: msg,
            type: "success",
            buttonText: "Entendido",
            onConfirm: () => {
              showLoginView();
            }
          });
        } else {
          window.showToast?.(msg, "info");
        }
      } catch (err) {
        const msg = "Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.";
        if (typeof window.showAlertModal === "function") {
          window.showAlertModal({
            title: "✓ Solicitud Recibida",
            message: msg,
            type: "success",
            buttonText: "Entendido"
          });
        }
      } finally {
        if (btnSubmitForgot) {
          btnSubmitForgot.disabled = false;
          btnSubmitForgot.textContent = "Enviar enlace de recuperación";
        }
      }
    });
  }

  if (!form) return;

  // Inicializar toggle de mostrar/ocultar contraseña
  setupPasswordToggle("login-password", "btn-toggle-password");


  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      if (typeof window.showAlertModal === "function") {
        window.showAlertModal({
          title: "⚠ Datos incompletos",
          message: "Ingresá tu correo electrónico y contraseña para continuar.",
          type: "warning",
          buttonText: "Entendido"
        });
      } else {
        window.showToast?.("Ingresá tu correo electrónico y contraseña para continuar.", "warning");
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Verificando...";

    try {
      const usuario = await window.apiLogin(email, password);
      window.showToast?.(`✓ Inicio de sesión exitoso`, "success");

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
      }, 600);
    } catch (err) {
      console.error("Error en login:", err);
      submitBtn.disabled = false;
      submitBtn.textContent = "Iniciar Sesión";

      const errType = err.type || err.data?.type || "";
      const status = err.status || 0;
      const email_login = emailInput.value.trim();

      if (typeof window.showAlertModal === "function") {
        if (errType === "user_not_found") {
          window.showAlertModal({
            title: "⚠ Cuenta no encontrada",
            message: "No existe una cuenta registrada con ese correo electrónico.",
            type: "warning",
            buttonText: "Entendido"
          });
        } else if (errType === "invalid_password") {
          window.showAlertModal({
            title: "⚠ Contraseña incorrecta",
            message: "La contraseña ingresada no es correcta.",
            type: "warning",
            buttonText: "Entendido"
          });
        } else if (errType === "email_not_verified" || status === 403) {
          window.showAlertModal({
            title: "⚠ Correo no verificado",
            message: "Debés verificar tu correo electrónico antes de iniciar sesión.",
            type: "unverified_email",
            buttonText: "Entendido",
            actionLabel: "Reenviar correo",
            onAction: () => _reenviarVerificacionDesdeLogin(email_login)
          });
        } else if (errType === "network_error" || status === 0) {
          window.showAlertModal({
            title: "⚠ Error de conexión",
            message: "No pudimos comunicarnos con el servidor.\nVerificá tu conexión e intentá nuevamente.",
            type: "danger",
            buttonText: "Entendido"
          });
        } else if (errType === "server_error" || status >= 500) {
          window.showAlertModal({
            title: "⚠ Error del servidor",
            message: "No pudimos iniciar sesión. Intentá nuevamente.",
            type: "danger",
            buttonText: "Entendido"
          });
        } else {
          window.showAlertModal({
            title: "⚠ Atención",
            message: err.data?.message || err.message || "No pudimos iniciar sesión. Intentá nuevamente.",
            type: "warning",
            buttonText: "Entendido"
          });
        }
      } else {
        window.showToast?.(err.data?.message || err.message || "Error al iniciar sesión.", "danger");
      }
    }
  });
}

/**
 * Configura la funcionalidad accesible de mostrar/ocultar contraseña en un input.
 * @param {string} inputId
 * @param {string} toggleBtnId
 */
function setupPasswordToggle(inputId, toggleBtnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(toggleBtnId);
  if (!input || !btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isPassword = input.getAttribute("type") === "password";
    if (isPassword) {
      input.setAttribute("type", "text");
      btn.setAttribute("aria-label", "Ocultar contraseña");
      btn.setAttribute("title", "Ocultar contraseña");
      const icon = btn.querySelector(".toggle-icon");
      if (icon) icon.textContent = "🙈";
    } else {
      input.setAttribute("type", "password");
      btn.setAttribute("aria-label", "Mostrar contraseña");
      btn.setAttribute("title", "Mostrar contraseña");
      const icon = btn.querySelector(".toggle-icon");
      if (icon) icon.textContent = "👁";
    }
  });
}

/**
 * Solicita el reenvío del correo de verificación desde la pantalla de login.
 * @param {string} email
 */
async function _reenviarVerificacionDesdeLogin(email) {
  if (!email) {
    window.showAlertModal?.({
      title: "⚠ Ingresá tu correo",
      message: "Ingresá tu correo electrónico en el campo superior para que podamos reenviarte el enlace de activación.",
      type: "warning",
      buttonText: "Entendido"
    });
    return;
  }
  try {
    const res = await fetch(`${window.API_BASE}/auth/resend-verification.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      window.showAlertModal?.({
        title: "✓ Correo enviado",
        message: data.message || "Te enviamos un nuevo enlace de activación a tu correo electrónico.",
        type: "success",
        buttonText: "Entendido"
      });
    } else {
      window.showAlertModal?.({
        title: "⚠ No se pudo reenviar",
        message: data?.message || "No se pudo reenviar el correo de verificación. Por favor esperá unos minutos e intentá nuevamente.",
        type: "warning",
        buttonText: "Entendido"
      });
    }
  } catch (e) {
    window.showAlertModal?.({
      title: "⚠ Error de conexión",
      message: "No pudimos comunicarnos con el servidor para reenviar el correo. Verificá tu conexión.",
      type: "danger",
      buttonText: "Entendido"
    });
  }
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

  // Inicializar toggles de contraseñas
  setupPasswordToggle("reg-password", "btn-toggle-reg-password");
  setupPasswordToggle("reg-confirm-password", "btn-toggle-reg-confirm-password");

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

    const showModal = typeof window.showAlertModal === "function" 
      ? window.showAlertModal 
      : (opts) => window.showToast?.(opts.message, "warning");

    // 1. Validar nombre
    const validarNombre = window.validarNombreCliente || ((str) => str && str.length >= 2);
    if (!validarNombre(nombre)) {
      showModal({
        title: "⚠ Datos incorrectos",
        message: "El nombre ingresado no es válido. Revisá que contenga únicamente letras válidas (entre 2 y 60 caracteres).",
        type: "warning",
        buttonText: "Entendido"
      });
      return;
    }

    // 2. Validar apellido
    if (!validarNombre(apellido)) {
      showModal({
        title: "⚠ Datos incorrectos",
        message: "El apellido ingresado no es válido. Revisá que contenga únicamente letras válidas (entre 2 y 60 caracteres).",
        type: "warning",
        buttonText: "Entendido"
      });
      return;
    }

    // 3. Validar email
    const validarEmail = window.validarEmailCliente || ((str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str));
    if (!validarEmail(email)) {
      showModal({
        title: "⚠ Datos incorrectos",
        message: "El correo electrónico ingresado no tiene un formato válido.",
        type: "warning",
        buttonText: "Entendido"
      });
      return;
    }

    // 4. Validar teléfono flexible
    const validarTel = window.validarTelefonoCliente || ((str) => str && str.length >= 7);
    if (!validarTel(telefono)) {
      showModal({
        title: "⚠ Datos incorrectos",
        message: "El número de teléfono ingresado no es válido. Ingresá un número con código de área (por ejemplo: 2920382930 o +54 9 294 455-8899).",
        type: "warning",
        buttonText: "Entendido"
      });
      return;
    }

    // 5. Validar contraseña
    if (password.length < 6) {
      showModal({
        title: "⚠ Datos incorrectos",
        message: "La contraseña debe tener al menos 6 caracteres.",
        type: "warning",
        buttonText: "Entendido"
      });
      return;
    }

    if (password !== confirmPassword) {
      showModal({
        title: "⚠ Datos incorrectos",
        message: "Las contraseñas ingresadas no coinciden.",
        type: "warning",
        buttonText: "Entendido"
      });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creando cuenta...";

    try {
      const resultado = await window.apiRegister({
        nombre,
        apellido,
        email,
        telefono,
        password,
        confirm_password: confirmPassword
      });

      submitBtn.disabled = false;
      submitBtn.textContent = "Crear Cuenta";

      if (typeof window.showAlertModal === "function") {
        window.showAlertModal({
          title: "✓ Cuenta creada correctamente",
          message: "Te enviamos un correo para verificar tu dirección.\n\nPor favor revisá tu bandeja de entrada o correo no deseado y hacé clic en el enlace para activar tu cuenta.",
          type: "success",
          buttonText: "Ir a Iniciar Sesión",
          onConfirm: () => {
            window.location.href = "login.html";
          }
        });
      } else {
        window.showToast?.("Cuenta creada correctamente. Te enviamos un correo para verificar tu dirección.", "success");
        setTimeout(() => { window.location.href = "login.html"; }, 1500);
      }
    } catch (err) {
      console.error("Error en registro:", err);
      submitBtn.disabled = false;
      submitBtn.textContent = "Crear Cuenta";

      const msg = err.data?.message || err.message || "No se pudo crear la cuenta. Intentá nuevamente.";
      if (typeof window.showAlertModal === "function") {
        window.showAlertModal({
          title: "⚠ No pudimos registrar la cuenta",
          message: msg,
          type: "warning",
          buttonText: "Entendido"
        });
      } else {
        window.showToast?.(msg, "danger");
      }
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

// ==============================================================================
// 5. LÓGICA DE LA PÁGINA RESTABLECER CONTRASEÑA (reset-password.html)
// ==============================================================================

async function initResetPasswordPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token") || "";

  const formPanel = document.getElementById("reset-form-panel");
  const successPanel = document.getElementById("reset-success-panel");
  const invalidPanel = document.getElementById("reset-invalid-panel");
  const invalidMsg = document.getElementById("reset-invalid-message");
  const form = document.getElementById("form-reset-password");
  const tokenInput = document.getElementById("reset-token");
  const newPassInput = document.getElementById("new-password");
  const confirmPassInput = document.getElementById("confirm-password");
  const submitBtn = document.getElementById("btn-submit-reset");
  const subtitle = document.getElementById("reset-subtitle");

  setupPasswordToggle("new-password", "btn-toggle-new-password");
  setupPasswordToggle("confirm-password", "btn-toggle-confirm-password");

  if (!token) {
    if (formPanel) formPanel.style.display = "none";
    if (invalidPanel) {
      invalidPanel.style.display = "block";
      if (invalidMsg) invalidMsg.textContent = "No se proporcionó un token de recuperación. Solicitá uno nuevo desde el login.";
    }
    return;
  }

  // Validar token contra backend
  try {
    const valRes = await window.apiValidateResetToken(token);
    if (valRes && valRes.success) {
      if (tokenInput) tokenInput.value = token;
      if (subtitle && valRes.data?.nombre) {
        subtitle.textContent = `Hola ${valRes.data.nombre}, ingresá tu nueva clave para acceder a tu cuenta.`;
      }
    } else {
      throw new Error(valRes?.message || "Token no válido");
    }
  } catch (err) {
    if (formPanel) formPanel.style.display = "none";
    if (invalidPanel) {
      invalidPanel.style.display = "block";
      if (invalidMsg) invalidMsg.textContent = err.data?.message || err.message || "Este enlace de recuperación ha vencido o ya fue utilizado.";
    }
    return;
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = newPassInput?.value || "";
      const confirmPassword = confirmPassInput?.value || "";

      if (newPassword.length < 6) {
        if (typeof window.showAlertModal === "function") {
          window.showAlertModal({
            title: "⚠ Contraseña muy corta",
            message: "La nueva contraseña debe tener al menos 6 caracteres.",
            type: "warning",
            buttonText: "Entendido"
          });
        } else {
          window.showToast?.("La nueva contraseña debe tener al menos 6 caracteres.", "warning");
        }
        return;
      }

      if (newPassword !== confirmPassword) {
        if (typeof window.showAlertModal === "function") {
          window.showAlertModal({
            title: "⚠ Contraseñas no coinciden",
            message: "Las contraseñas ingresadas no coinciden. Verificá que ambas sean iguales.",
            type: "warning",
            buttonText: "Entendido"
          });
        } else {
          window.showToast?.("Las contraseñas no coinciden.", "warning");
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Actualizando...";
      }

      try {
        await window.apiResetPassword(token, newPassword, confirmPassword);
        if (formPanel) formPanel.style.display = "none";
        if (successPanel) successPanel.style.display = "block";
        window.showToast?.("✓ Tu contraseña fue actualizada correctamente.", "success");
      } catch (err) {
        console.error("Error al restablecer contraseña:", err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Guardar Nueva Contraseña";
        }
        const errMsg = err.data?.message || err.message || "No se pudo actualizar la contraseña. Por favor solicitá un nuevo enlace.";
        if (typeof window.showAlertModal === "function") {
          window.showAlertModal({
            title: "⚠ Error al actualizar",
            message: errMsg,
            type: "danger",
            buttonText: "Entendido"
          });
        } else {
          window.showToast?.(errMsg, "danger");
        }
      }
    });
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
  window.initResetPasswordPage = initResetPasswordPage;
}

