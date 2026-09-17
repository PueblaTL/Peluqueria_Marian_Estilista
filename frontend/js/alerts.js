/**
 * alerts.js - Sistema Centralizado de Alertas Visuales, Modales y Validaciones
 * Marian Estilista - Vanilla JavaScript
 */

(function () {
  let activeAlertResolve = null;

  /**
   * Crea o asegura la existencia del contenedor de modal en el DOM.
   */
  function ensureModalDom() {
    let backdrop = document.getElementById("marian-alert-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "marian-alert-backdrop";
      backdrop.className = "marian-alert-backdrop";
      backdrop.setAttribute("role", "dialog");
      backdrop.setAttribute("aria-modal", "true");
      backdrop.setAttribute("aria-hidden", "true");

      backdrop.innerHTML = `
        <div class="marian-alert-modal" id="marian-alert-modal-box">
          <div id="marian-alert-icon" class="marian-alert-icon warning">⚠</div>
          <h3 id="marian-alert-title" class="marian-alert-title">Alerta</h3>
          <p id="marian-alert-msg" class="marian-alert-msg"></p>
          <div id="marian-alert-actions" class="marian-alert-actions">
            <button type="button" id="marian-alert-btn-confirm" class="marian-btn marian-btn-gold">Entendido</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);

      // Cerrar al presionar Escape
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && backdrop.classList.contains("is-active")) {
          closeModal(false);
        }
      });

      // Cerrar al hacer clic en el backdrop fuera de la tarjeta
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          closeModal(false);
        }
      });
    }
    return backdrop;
  }

  function closeModal(result = true) {
    const backdrop = document.getElementById("marian-alert-backdrop");
    if (backdrop) {
      backdrop.classList.remove("is-active");
      backdrop.setAttribute("aria-hidden", "true");
    }
    if (typeof activeAlertResolve === "function") {
      activeAlertResolve(result);
      activeAlertResolve = null;
    }
  }

  /**
   * Muestra un modal de alerta visual integrado al diseño de Marian Estilista.
   *
   * @param {Object} options
   * @param {string} options.title Título de la alerta (ej: "⚠ Datos incorrectos")
   * @param {string} options.message Mensaje explicativo
   * @param {string} options.type 'warning' | 'danger' | 'error' | 'success' | 'info' | 'availability' | 'unverified_email'
   * @param {string} options.buttonText Texto del botón (por defecto "Entendido")
   * @param {string|null} [options.actionLabel] Texto de un botón de acción secundario (ej: "Reenviar correo")
   * @param {Function|null} [options.onAction] Callback al presionar el botón de acción
   * @param {Function|null} [options.onConfirm] Callback al presionar el botón principal
   * @returns {Promise<boolean>}
   */
  function showAlertModal({
    title = "Atención",
    message = "",
    type = "warning",
    buttonText = "Entendido",
    actionLabel = null,
    onAction = null,
    onConfirm = null
  } = {}) {
    ensureModalDom();

    const backdrop = document.getElementById("marian-alert-backdrop");
    const iconEl = document.getElementById("marian-alert-icon");
    const titleEl = document.getElementById("marian-alert-title");
    const msgEl = document.getElementById("marian-alert-msg");
    const actionsEl = document.getElementById("marian-alert-actions");

    // Configurar icono según el tipo
    iconEl.className = `marian-alert-icon ${type}`;
    if (type === "success") {
      iconEl.textContent = "✓";
    } else if (type === "danger" || type === "error") {
      iconEl.textContent = "✕";
    } else if (type === "unverified_email" || type === "info") {
      iconEl.textContent = "✉";
    } else if (type === "lock") {
      iconEl.textContent = "🔒";
    } else {
      iconEl.textContent = "⚠";
    }

    titleEl.textContent = title;
    msgEl.textContent = message;

    if (actionLabel && typeof onAction === "function") {
      actionsEl.innerHTML = `
        <button type="button" id="marian-alert-btn-confirm" class="marian-btn marian-btn-secondary">${buttonText}</button>
        <button type="button" id="marian-alert-btn-action" class="marian-btn marian-btn-gold">${actionLabel}</button>
      `;
    } else {
      actionsEl.innerHTML = `
        <button type="button" id="marian-alert-btn-confirm" class="marian-btn marian-btn-gold">${buttonText}</button>
      `;
    }

    return new Promise((resolve) => {
      activeAlertResolve = (res) => {
        if (typeof onConfirm === "function") onConfirm();
        resolve(res);
      };

      const btnConfirm = document.getElementById("marian-alert-btn-confirm");
      if (btnConfirm) {
        btnConfirm.onclick = () => closeModal(true);
      }

      const btnAction = document.getElementById("marian-alert-btn-action");
      if (btnAction) {
        btnAction.onclick = () => {
          closeModal(true);
          onAction();
        };
      }

      backdrop.classList.add("is-active");
      backdrop.setAttribute("aria-hidden", "false");
      setTimeout(() => (btnAction || btnConfirm)?.focus(), 50);
    });
  }

  /**
   * Muestra un modal de confirmación con dos botones.
   *
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  function showConfirmModal({
    title = "Confirmación",
    message = "¿Deseas continuar con esta acción?",
    type = "warning",
    confirmText = "Aceptar",
    cancelText = "Cancelar",
    onConfirm = null,
    onCancel = null
  } = {}) {
    ensureModalDom();

    const backdrop = document.getElementById("marian-alert-backdrop");
    const iconEl = document.getElementById("marian-alert-icon");
    const titleEl = document.getElementById("marian-alert-title");
    const msgEl = document.getElementById("marian-alert-msg");
    const actionsEl = document.getElementById("marian-alert-actions");

    iconEl.className = `marian-alert-icon ${type}`;
    iconEl.textContent = (type === "danger") ? "✕" : "⚠";

    titleEl.textContent = title;
    msgEl.textContent = message;

    actionsEl.innerHTML = `
      <button type="button" id="marian-alert-btn-cancel" class="marian-btn marian-btn-secondary">${cancelText}</button>
      <button type="button" id="marian-alert-btn-confirm" class="marian-btn marian-btn-gold">${confirmText}</button>
    `;

    return new Promise((resolve) => {
      activeAlertResolve = (res) => {
        if (res && typeof onConfirm === "function") onConfirm();
        if (!res && typeof onCancel === "function") onCancel();
        resolve(res);
      };

      const btnCancel = document.getElementById("marian-alert-btn-cancel");
      const btnConfirm = document.getElementById("marian-alert-btn-confirm");

      if (btnCancel) btnCancel.onclick = () => closeModal(false);
      if (btnConfirm) btnConfirm.onclick = () => closeModal(true);

      backdrop.classList.add("is-active");
      backdrop.setAttribute("aria-hidden", "false");
      setTimeout(() => btnConfirm?.focus(), 50);
    });
  }

  // ==============================================================================
  // VALIDACIONES FRONTEND (Consistentes con el Backend PHP)
  // ==============================================================================

  /**
   * Valida un nombre o apellido asegurando caracteres válidos en español (tildes, diéresis, ñ).
   * No rechaza nombres válidos como Á, É, Í, Ó, Ú, Ü, Ñ.
   *
   * @param {string} nombre
   * @returns {boolean}
   */
  function validarNombreCliente(nombre) {
    if (!nombre) return false;
    const str = String(nombre).trim();
    if (str.length < 2 || str.length > 60) return false;

    // Acepta letras con tildes, diéresis, ñ/Ñ, espacios y guiones
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]{2,60}$/u;
    return regex.test(str);
  }

  /**
   * Valida un número telefónico flexible (con código de área, internacional, separadores).
   * Acepta: 2920382930, 2920 382930, 2920-382930, 2920 38-2930, +54 2920 382930, +5492920382930, etc.
   * Rechaza: letras, '123', '++++', valores sin suficientes dígitos.
   *
   * @param {string} telefono
   * @returns {boolean}
   */
  function validarTelefonoCliente(telefono) {
    if (!telefono) return false;
    const str = String(telefono).trim();

    // Caracteres permitidos: opcional '+' al inicio, números, espacios, guiones y paréntesis
    const formatoGeneral = /^\+?[0-9\s\-\(\)]{7,25}$/;
    if (!formatoGeneral.test(str)) return false;

    // Longitud de dígitos limpios: entre 8 y 15 dígitos
    const soloDigitos = str.replace(/\D/g, "");
    if (soloDigitos.length < 8 || soloDigitos.length > 15) {
      return false;
    }

    return true;
  }

  /**
   * Normaliza un número de teléfono de forma idéntica al backend PHP.
   *
   * @param {string} telefono
   * @returns {string}
   */
  function normalizarTelefonoCliente(telefono) {
    const str = String(telefono || "").trim();
    const tienePlus = str.startsWith("+");
    const digitos = str.replace(/\D/g, "");
    return tienePlus ? `+${digitos}` : digitos;
  }

  /**
   * Valida el formato de un correo electrónico.
   *
   * @param {string} email
   * @returns {boolean}
   */
  function validarEmailCliente(email) {
    if (!email) return false;
    const str = String(email).trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(str);
  }

  // Exportar al objeto global
  if (typeof window !== "undefined") {
    window.showAlertModal = showAlertModal;
    window.showConfirmModal = showConfirmModal;
    window.validarNombreCliente = validarNombreCliente;
    window.validarTelefonoCliente = validarTelefonoCliente;
    window.normalizarTelefonoCliente = normalizarTelefonoCliente;
    window.validarEmailCliente = validarEmailCliente;
  }
})();
