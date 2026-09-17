/**
 * reservas.js - Lógica Integral del Asistente de Reserva de Turnos en 6 Pasos
 * Marian Estilista - Mariano (Único Profesional)
 */

class BookingWizard {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 6;

    // Estado de la reserva
    this.state = {
      servicio: null,
      profesional: {
        id: "prof-1",
        nombre: "Mariano",
        titulo: "Estilista Profesional & Colorista"
      },
      fecha: null,       // 'YYYY-MM-DD'
      hora: null,        // 'HH:MM'
      cliente: {
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        notas: ""
      },
      turnoConfirmado: null
    };

    // Estado del calendario
    const now = new Date();
    this.calCurrentDate = new Date(now.getFullYear(), now.getMonth(), 1);

    this.init();
  }

  async init() {
    // 1. Inicializar almacenamiento si es necesario
    if (window.StorageService) {
      window.StorageService.init();
    }

    this.cacheDom();
    this.bindEvents();
    await this.loadInitialData();
    await this.checkDraftBooking();
    this.checkUrlParams();
    this.updateStepUI();
  }

  async checkDraftBooking() {
    try {
      const draft = sessionStorage.getItem("draft_reserva");
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && parsed.servicio && parsed.fecha && parsed.hora) {
          this.state = { ...this.state, ...parsed };
          sessionStorage.removeItem("draft_reserva");
          const user = await window.apiGetCurrentUser?.();
          if (user) {
            this.state.cliente.nombre = user.nombre;
            this.state.cliente.apellido = user.apellido || "";
            this.state.cliente.email = user.email;
            this.state.cliente.telefono = user.telefono || "";
          }
          this.currentStep = 5;
          this.renderSummary();
          this.showToast?.("✨ Sesión iniciada. Ya puedes confirmar tu turno.", "success");
        }
      }
    } catch (e) {
      console.warn("Error al recuperar borrador:", e);
    }
  }

  cacheDom() {
    this.stepperFill = document.getElementById("stepper-progress-fill");
    this.stepItems = document.querySelectorAll(".step-item");
    this.stepContents = document.querySelectorAll(".wizard-step-content");

    this.btnBack = document.getElementById("btn-wizard-prev");
    this.btnNext = document.getElementById("btn-wizard-next");
    this.wizardFooter = document.getElementById("wizard-footer-nav");

    // Contenedores dinámicos
    this.servicesContainer = document.getElementById("booking-services-list");
    this.calendarDaysGrid = document.getElementById("calendar-days-grid");
    this.calendarMonthTitle = document.getElementById("calendar-month-title");
    this.calPrevBtn = document.getElementById("cal-prev-btn");
    this.calNextBtn = document.getElementById("cal-next-btn");
    this.slotsGrid = document.getElementById("booking-slots-grid");
    this.slotsDateLabel = document.getElementById("slots-date-label");

    // Formulario de cliente
    this.clientForm = document.getElementById("client-info-form");

    // Resumen
    this.summaryContainer = document.getElementById("summary-ticket-details");

    // Confirmación
    this.confirmationContainer = document.getElementById("confirmation-details-box");
  }

  bindEvents() {
    // Botones de navegación
    if (this.btnBack) {
      this.btnBack.addEventListener("click", () => this.goToPrevStep());
    }

    if (this.btnNext) {
      this.btnNext.addEventListener("click", () => this.handleNextClick());
    }

    // Navegación de meses en el calendario
    if (this.calPrevBtn) {
      this.calPrevBtn.addEventListener("click", () => {
        this.calCurrentDate.setMonth(this.calCurrentDate.getMonth() - 1);
        this.renderCalendar();
      });
    }

    if (this.calNextBtn) {
      this.calNextBtn.addEventListener("click", () => {
        this.calCurrentDate.setMonth(this.calCurrentDate.getMonth() + 1);
        this.renderCalendar();
      });
    }

    // Permitir clic en pasos completados del stepper
    this.stepItems.forEach(item => {
      item.addEventListener("click", () => {
        const stepNum = parseInt(item.getAttribute("data-step"));
        if (stepNum < this.currentStep && this.currentStep < 6) {
          this.goToStep(stepNum);
        }
      });
    });
  }

  async loadInitialData() {
    try {
      this.profesional = (typeof window.apiGetProfesionalDefault === "function")
        ? await window.apiGetProfesionalDefault()
        : await window.StorageService.getProfesional();
      this.state.profesional = this.profesional;
      await this.renderServices();
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
    }
  }

  /**
   * Lee si vino un servicio preseleccionado por URL (?servicio=srv-1)
   */
  async checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get("servicio");

    if (serviceParam) {
      const servicios = (typeof window.apiGetServicios === "function")
        ? await window.apiGetServicios(true)
        : await window.StorageService.getServicios(true);
      const cleanParam = String(serviceParam).replace(/^srv-/, "");
      const matched = servicios.find(s => 
        String(s.id) === String(serviceParam) || 
        String(s.id) === cleanParam ||
        `srv-${s.id}` === String(serviceParam)
      );
      if (matched) {
        this.selectService(matched);
      }
    }
  }

  // ==========================================
  // RENDERIZADO DEL PASO 1: SERVICIOS
  // ==========================================
  async renderServices() {
    if (!this.servicesContainer) return;

    this.servicesContainer.innerHTML = `
    <div class="loading-spinner-msg">
      Cargando servicios oficiales...
    </div>
  `;

    const servicios = (typeof window.apiGetServicios === "function")
      ? await window.apiGetServicios(true)
      : await window.StorageService.getServicios(true);

    if (!servicios || servicios.length === 0) {
      this.servicesContainer.innerHTML = `
      <p>No hay servicios disponibles actualmente.</p>
    `;
      return;
    }

    // Garantizar que todos los servicios tengan duracion_minutos y duracionMinutos normalizados
    const serviciosNorm = servicios.map(s => {
      const dur = Number(s.duracion_minutos || s.duracionMinutos || 60);
      return {
        ...s,
        duracion_minutos: dur,
        duracionMinutos: dur
      };
    });

    this.servicesContainer.innerHTML = "";

    serviciosNorm.forEach(s => {
      const card = document.createElement("div");

      // ==========================================
      // IDENTIFICADOR DEL SERVICIO
      // ==========================================
      card.className = `booking-service-card ${String(this.state.servicio?.id) === String(s.id)
        ? "selected"
        : ""
        }`;

      // IMPORTANTE: agregar el ID a la tarjeta
      card.dataset.serviceId = String(s.id);

      const imgSrc =
        (s.imagen &&
          !s.imagen.startsWith("http") &&
          !s.imagen.startsWith("data:"))
          ? (s.imagen.startsWith("../")
            ? s.imagen
            : `../${s.imagen}`)
          : s.imagen;

      const isSelected =
        String(this.state.servicio?.id) === String(s.id);

      card.innerHTML = `
      <div class="book-srv-img-wrap">
        <img 
          src="${imgSrc}" 
          alt="${s.nombre}" 
          loading="lazy"
        />

        <span class="book-srv-badge">
          ${s.categoria || "Servicio"}
        </span>
      </div>

      <div class="book-srv-body">

        <div class="book-srv-header">
          <h4>${s.nombre}</h4>

          <span class="book-srv-price">
            ${s.precioTexto || ('$' + Number(s.precio).toLocaleString("es-AR"))}
          </span>
        </div>

        <p class="book-srv-desc">
          ${s.descripcion}
        </p>

        <div class="book-srv-meta">

          <span class="book-srv-duration">
            ⏱ ${s.duracionMinutos || s.duracion_minutos || 60} min
          </span>

          <span class="book-srv-select-btn">
            ${isSelected ? "✓ Seleccionado" : "Seleccionar"}
          </span>

        </div>

      </div>
    `;

      // ==========================================
      // CLICK EN LA TARJETA
      // ==========================================
      card.addEventListener("click", () => {
        this.selectService(s);
      });

      this.servicesContainer.appendChild(card);
    });
  }


  // ==========================================
  // SELECCIONAR SERVICIO
  // ==========================================
  selectService(servicio) {
    this.state.servicio = servicio;

    // ==========================================
    // ACTUALIZAR TODAS LAS TARJETAS
    // ==========================================
    document
      .querySelectorAll(".booking-service-card")
      .forEach(card => {

        const cardServiceId = String(
          card.dataset.serviceId
        );

        const selectedServiceId = String(
          servicio.id
        );

        const btn = card.querySelector(
          ".book-srv-select-btn"
        );

        if (cardServiceId === selectedServiceId) {

          // Tarjeta seleccionada
          card.classList.add("selected");

          if (btn) {
            btn.textContent = "✓ Seleccionado";
          }

        } else {

          // Tarjetas no seleccionadas
          card.classList.remove("selected");

          if (btn) {
            btn.textContent = "Seleccionar";
          }
        }
      });

    // Habilitar botón siguiente
    if (this.btnNext) {
      this.btnNext.disabled = false;
    }
  }
  // ==========================================
  // RENDERIZADO DEL PASO 2: CALENDARIO
  // ==========================================
  // Llama a esta función cuando inicialices tu Wizard/Clase
  initCalendar() {
    // Referencias al DOM (ajusta si ya las tienes en tu constructor)
    this.calPrevBtn = document.getElementById('cal-prev-btn');
    this.calNextBtn = document.getElementById('cal-next-btn');
    this.calendarMonthTitle = document.getElementById('calendar-month-title');
    this.calendarDaysGrid = document.getElementById('calendar-days-grid');

    // Iniciar con la fecha actual
    this.calCurrentDate = new Date();

    // Funcionalidad: Mes anterior
    this.calPrevBtn.addEventListener('click', () => {
      this.calCurrentDate.setMonth(this.calCurrentDate.getMonth() - 1);
      this.renderCalendar();
    });

    // Funcionalidad: Mes siguiente
    this.calNextBtn.addEventListener('click', () => {
      this.calCurrentDate.setMonth(this.calCurrentDate.getMonth() + 1);
      this.renderCalendar();
    });

    // Render inicial
    this.renderCalendar();
  }
  renderCalendar() {
    if (!this.calendarDaysGrid || !this.calendarMonthTitle) return;

    const year = this.calCurrentDate.getFullYear();
    const month = this.calCurrentDate.getMonth();

    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    this.calendarMonthTitle.textContent = `${monthNames[month]} ${year}`;

    // Validar botón de mes anterior (evitar navegar al pasado)
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    if (this.calPrevBtn) {
      this.calPrevBtn.disabled = isCurrentMonth;
    }

    this.calendarDaysGrid.innerHTML = "";

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDayDate = new Date(year, month + 1, 0).getDate();

    // Días vacíos previos
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "calendar-day-cell empty";
      this.calendarDaysGrid.appendChild(emptyCell);
    }

    // Días del mes
    for (let day = 1; day <= lastDayDate; day++) {
      const cell = document.createElement("div");
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();

      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      // Reglas: Atención Martes(2) a Sábado(6)
      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isWorkingDay = dayOfWeek >= 2 && dayOfWeek <= 6;

      cell.className = "calendar-day-cell";
      cell.textContent = day;
      cell.setAttribute("data-date", dateString);

      if (isPast) {
        cell.classList.add("past");
      } else if (!isWorkingDay) {
        cell.classList.add("closed");
        cell.title = "Cerrado";
      } else {
        cell.classList.add("available");

        if (this.state && this.state.fecha === dateString) {
          cell.classList.add("selected");
        }

        cell.addEventListener("click", () => {
          this.selectDate(dateString);
        });
      }

      this.calendarDaysGrid.appendChild(cell);
    }
  }

  selectDate(dateString) {
    if (!this.state) this.state = {};
    this.state.fecha = dateString;

    // Actualizar visualmente sin recargar todo el calendario
    document.querySelectorAll(".calendar-day-cell.available").forEach(c => {
      if (c.getAttribute("data-date") === dateString) {
        c.classList.add("selected");
      } else {
        c.classList.remove("selected");
      }
    });

    if (this.btnNext) this.btnNext.disabled = false;
  }
  // ==========================================
  // RENDERIZADO DEL PASO 3: SLOTS HORARIOS
  // ==========================================
  async renderSlots() {
    if (!this.slotsGrid) return;
    this.slotsGrid.innerHTML = `<div class="loading-spinner-msg">Consultando horarios disponibles...</div>`;

    if (this.slotsDateLabel && this.state.fecha) {
      const [y, m, d] = this.state.fecha.split("-").map(Number);
      const dateFormatted = new Date(y, m - 1, d).toLocaleDateString("es-AR", {
        weekday: "long", day: "numeric", month: "long"
      });
      this.slotsDateLabel.innerHTML = `Horarios disponibles para el <strong>${dateFormatted}</strong> con <strong>Mariano</strong>:`;
    }

    try {
      const duracion = this.state.servicio?.duracion_minutos || this.state.servicio?.duracionMinutos || 60;
      const profId = this.state.profesional?.id || 1;
      const slots = (typeof window.apiGetDisponibilidad === "function")
        ? await window.apiGetDisponibilidad(this.state.fecha, duracion, profId)
        : await window.StorageService.getDisponibilidad(this.state.fecha, duracion);

      this.slotsGrid.innerHTML = "";

      if (!slots || slots.length === 0) {
        this.slotsGrid.innerHTML = `<div class="no-slots-msg">No hay turnos disponibles para esta fecha. Por favor selecciona otro día.</div>`;
        return;
      }

      slots.forEach(slot => {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = `time-slot-pill ${slot.disponible ? 'available' : 'occupied'} ${this.state.hora === slot.hora ? 'selected' : ''}`;
        pill.textContent = slot.hora;
        pill.setAttribute("data-time", slot.hora);

        if (slot.disponible) {
          pill.addEventListener("click", () => {
            this.selectTime(slot.hora);
          });
        } else {
          pill.disabled = true;
          pill.title = "Horario reservado";
        }

        this.slotsGrid.appendChild(pill);
      });
    } catch (err) {
      console.error("Error al obtener disponibilidad:", err);
      this.slotsGrid.innerHTML = `<div class="error-msg">Error al cargar horarios.</div>`;
    }
  }

  selectTime(hora) {
    this.state.hora = hora;

    document.querySelectorAll(".time-slot-pill.available").forEach(p => {
      if (p.getAttribute("data-time") === hora) {
        p.classList.add("selected");
      } else {
        p.classList.remove("selected");
      }
    });

    this.btnNext.disabled = false;
  }

  // ==========================================
  // ==========================================
  // PASO 4: FORMULARIO CLIENTE
  // ==========================================
  validateClientForm() {
    const nombre = document.getElementById("cli-nombre")?.value.trim() || "";
    const apellido = document.getElementById("cli-apellido")?.value.trim() || "";
    const telefono = document.getElementById("cli-telefono")?.value.trim() || "";
    const email = document.getElementById("cli-email")?.value.trim() || "";
    const notas = document.getElementById("cli-notas")?.value.trim() || "";

    const showModal = typeof window.showAlertModal === "function"
      ? window.showAlertModal
      : (opts) => this.showToast(opts.message, "warning");

    if (!nombre || !apellido || !telefono || !email) {
      showModal({
        title: "⚠ Datos incompletos",
        message: "Por favor completá todos los campos requeridos (*) para continuar con tu turno.",
        type: "warning",
        buttonText: "Entendido"
      });
      return false;
    }

    const valNom = window.validarNombreCliente || ((s) => s && s.length >= 2);
    if (!valNom(nombre)) {
      showModal({
        title: "⚠ Datos incorrectos",
        message: "El nombre ingresado no es válido. Revisá que contenga únicamente letras válidas (entre 2 y 60 caracteres).",
        type: "warning",
        buttonText: "Entendido"
      });
      return false;
    }

    if (!valNom(apellido)) {
      showModal({
        title: "⚠ Datos incorrectos",
        message: "El apellido ingresado no es válido. Revisá que contenga únicamente letras válidas (entre 2 y 60 caracteres).",
        type: "warning",
        buttonText: "Entendido"
      });
      return false;
    }

    const valEmail = window.validarEmailCliente || ((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
    if (!valEmail(email)) {
      showModal({
        title: "⚠ Datos incorrectos",
        message: "El correo electrónico ingresado no tiene un formato válido.",
        type: "warning",
        buttonText: "Entendido"
      });
      return false;
    }

    const valTel = window.validarTelefonoCliente || ((s) => s && s.length >= 7);
    if (!valTel(telefono)) {
      showModal({
        title: "⚠ Teléfono inválido",
        message: "El número de teléfono ingresado no es válido. Ingresá un número con código de área (por ejemplo: 2920382930 o +54 9 294 455-8899).",
        type: "warning",
        buttonText: "Entendido"
      });
      return false;
    }

    this.state.cliente = { nombre, apellido, telefono, email, notas };
    return true;
  }

  // ==========================================
  // RENDERIZADO DEL PASO 5: RESUMEN
  // ==========================================
  renderSummary() {
    if (!this.summaryContainer) return;

    const [y, m, d] = (this.state.fecha || "").split("-").map(Number);
    const dateFormatted = this.state.fecha
      ? new Date(y, m - 1, d).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : "-";

    this.summaryContainer.innerHTML = `
      <div class="ticket-row-main">
        <div class="ticket-service-badge">
          <span class="ticket-srv-tag">${this.state.servicio?.categoria || 'Servicio'}</span>
          <h3>${this.state.servicio?.nombre}</h3>
          <p>${this.state.servicio?.descripcion}</p>
        </div>
        <div class="ticket-price-box">
          <span class="ticket-price-label">Precio</span>
          <span class="ticket-price-val">${this.state.servicio?.precioTexto || ('$' + Number(this.state.servicio?.precio).toLocaleString("es-AR"))}</span>
        </div>
      </div>

      <div class="ticket-grid-meta">
        <div class="ticket-meta-block">
          <span class="ticket-meta-label">💇‍♂️ Profesional</span>
          <span class="ticket-meta-val">Mariano (Estilista)</span>
        </div>
        <div class="ticket-meta-block">
          <span class="ticket-meta-label">📅 Fecha de Cita</span>
          <span class="ticket-meta-val">${dateFormatted}</span>
        </div>
        <div class="ticket-meta-block">
          <span class="ticket-meta-label">⏰ Horario</span>
          <span class="ticket-meta-val">${this.state.hora} hs (${this.state.servicio?.duracionMinutos || this.state.servicio?.duracion_minutos || 60} min)</span>
        </div>
        <div class="ticket-meta-block">
          <span class="ticket-meta-label">👤 Clienta</span>
          <span class="ticket-meta-val">${this.state.cliente.nombre} ${this.state.cliente.apellido}</span>
        </div>
        <div class="ticket-meta-block">
          <span class="ticket-meta-label">📱 Teléfono</span>
          <span class="ticket-meta-val">${this.state.cliente.telefono}</span>
        </div>
        <div class="ticket-meta-block">
          <span class="ticket-meta-label">✉️ Email</span>
          <span class="ticket-meta-val">${this.state.cliente.email}</span>
        </div>
      </div>

      ${this.state.cliente.notas ? `
        <div class="ticket-notes-box">
          <strong>Observaciones:</strong>
          <p>${this.state.cliente.notas}</p>
        </div>
      ` : ''}
    `;
  }

  // ==========================================
  // CONFIRMACIÓN FINAL & GUARDADO (PASO 6)
  // ==========================================
  async confirmBooking() {
    this.btnNext.disabled = true;
    this.btnNext.textContent = "Procesando turno...";

    try {
      // 1. Verificar si el usuario está autenticado
      let currentUser = null;
      if (typeof window.apiGetCurrentUser === "function") {
        currentUser = await window.apiGetCurrentUser();
      }

      if (!currentUser) {
        if (typeof window.showAlertModal === "function") {
          window.showAlertModal({
            title: "⚠ Iniciar Sesión",
            message: "Para confirmar tu reserva, iniciá sesión o creá tu cuenta en Marian Estilista.",
            type: "warning",
            buttonText: "Iniciar Sesión",
            onConfirm: () => {
              sessionStorage.setItem("draft_reserva", JSON.stringify(this.state));
              window.location.href = `login.html?redirect=${encodeURIComponent('reservas.html')}`;
            }
          });
        } else {
          sessionStorage.setItem("draft_reserva", JSON.stringify(this.state));
          window.location.href = `login.html?redirect=${encodeURIComponent('reservas.html')}`;
        }
        this.btnNext.disabled = false;
        this.btnNext.textContent = "Iniciar Sesión para Confirmar";
        return;
      }

      // 2. Registrar la reserva mediante la API REST de PHP enviando teléfono y datos completos
      let nuevoTurno;
      if (typeof window.apiCrearReserva === "function") {
        nuevoTurno = await window.apiCrearReserva({
          servicio_id: this.state.servicio.id,
          profesional_id: this.state.profesional?.id || 1,
          fecha: this.state.fecha,
          hora: this.state.hora,
          telefono: this.state.cliente.telefono,
          nombre: this.state.cliente.nombre,
          apellido: this.state.cliente.apellido,
          observaciones: this.state.cliente?.notas || ""
        });
      } else {
        nuevoTurno = await window.StorageService.saveTurno({
          servicioId: this.state.servicio.id,
          servicioNombre: this.state.servicio.nombre,
          fecha: this.state.fecha,
          hora: this.state.hora,
          duracionMinutos: this.state.servicio.duracion_minutos || this.state.servicio.duracionMinutos || 60,
          precio: this.state.servicio.precio,
          precioTexto: this.state.servicio.precioTexto || ('$' + Number(this.state.servicio.precio).toLocaleString("es-AR")),
          cliente: this.state.cliente
        });
      }

      sessionStorage.removeItem("draft_reserva");
      this.state.turnoConfirmado = nuevoTurno;

      // Renderizar comprobante y comprobante visual VIP
      this.renderConfirmation(nuevoTurno);

      // Avanzar al paso 6
      this.currentStep = 6;
      this.updateStepUI();

      if (typeof window.showAlertModal === "function") {
        window.showAlertModal({
          title: "✓ Turno confirmado",
          message: "¡Tu turno ha sido reservado correctamente!\nA continuación podés descargar tu comprobante o compartirlo por WhatsApp.",
          type: "success",
          buttonText: "Ver comprobante"
        });
      } else {
        this.showToast("✓ Turno confirmado", "success");
      }
    } catch (err) {
      console.error("Error al confirmar turno:", err);
      this.btnNext.disabled = false;
      this.btnNext.textContent = "✨ Confirmar Turno";

      const errType = err.type || err.data?.type || "";
      const msg = err.data?.message || err.message || "No pudimos completar la reserva.";

      if (typeof window.showAlertModal === "function") {
        if (errType === "availability" || err.status === 409) {
          window.showAlertModal({
            title: "⚠ Horario no disponible",
            message: msg || "El horario seleccionado ya no se encuentra disponible. Por favor elegí otro horario disponible.",
            type: "warning",
            buttonText: "Elegir otro horario",
            onConfirm: () => {
              this.goToStep(3);
            }
          });
        } else if (errType === "unverified_email" || err.status === 403) {
          window.showAlertModal({
            title: "⚠ Correo no verificado",
            message: "Debés verificar tu correo electrónico antes de realizar una reserva.",
            type: "unverified_email",
            buttonText: "Entendido",
            actionLabel: "Reenviar correo",
            onAction: async () => {
              const user = await window.apiGetCurrentUser?.();
              if (user?.email) {
                await fetch(`${window.API_BASE}/auth/resend-verification.php`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ email: user.email })
                });
                window.showToast?.("Te enviamos un nuevo enlace de activación a tu correo.", "success");
              }
            }
          });
        } else {
          window.showAlertModal({
            title: "⚠ No pudimos completar la reserva",
            message: msg,
            type: "danger",
            buttonText: "Entendido"
          });
        }
      } else {
        this.showToast(msg, "danger");
      }
    }
  }

  renderConfirmation(turno) {
    if (!this.confirmationContainer) return;

    const fechaIso = turno.fecha || this.state.fecha || "reserva";
    const [y, m, d] = (fechaIso).split("-").map(Number);
    const dateFormatted = new Date(y, m - 1, d).toLocaleDateString("es-AR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    const clienteNombre = (turno.usuario_nombre && turno.usuario_apellido)
      ? `${turno.usuario_nombre} ${turno.usuario_apellido}`
      : (turno.cliente
          ? `${turno.cliente.nombre} ${turno.cliente.apellido || ''}`.trim()
          : `${this.state.cliente.nombre} ${this.state.cliente.apellido}`.trim());

    const servicioNombre = turno.servicio_nombre || turno.servicioNombre || this.state.servicio?.nombre || "Corte & Peinado";
    const profesionalNombre = turno.profesional_nombre || turno.profesionalNombre || "Mariano";
    const hora = (turno.hora || this.state.hora || "").substring(0, 5);
    const duracionMinutos = turno.duracion_minutos || turno.duracionMinutos || this.state.servicio?.duracion_minutos || 60;
    const precio = turno.precio !== undefined ? turno.precio : (this.state.servicio?.precio || 0);

    // Plantilla exacta del comprobante requerida por el usuario (Sección 17)
    this.confirmationContainer.innerHTML = `
      <div id="voucher-comprobante-card" class="voucher-card">
        <div class="voucher-header">
          <div class="voucher-brand-symbol">M</div>
          <h2 class="voucher-brand-title">MARIAN ESTILISTA</h2>
          <div class="voucher-brand-sub">Peluquería & Colorimetría</div>
          <div class="voucher-badge-confirmed">TURNO CONFIRMADO</div>
        </div>

        <div class="voucher-body">
          <div class="voucher-row">
            <span class="voucher-label">Cliente:</span>
            <span class="voucher-value">${clienteNombre}</span>
          </div>
          <div class="voucher-row">
            <span class="voucher-label">Servicio:</span>
            <span class="voucher-value">${servicioNombre}</span>
          </div>
          <div class="voucher-row">
            <span class="voucher-label">Profesional:</span>
            <span class="voucher-value">${profesionalNombre}</span>
          </div>
          <div class="voucher-row">
            <span class="voucher-label">Fecha:</span>
            <span class="voucher-value">${dateFormatted}</span>
          </div>
          <div class="voucher-row">
            <span class="voucher-label">Hora:</span>
            <span class="voucher-value">${hora} hs</span>
          </div>
          <div class="voucher-row">
            <span class="voucher-label">Duración:</span>
            <span class="voucher-value">${duracionMinutos} min</span>
          </div>
          <div class="voucher-row">
            <span class="voucher-label">Precio:</span>
            <span class="voucher-value">${turno.precioTexto || this.state.servicio?.precioTexto || ('$' + Number(precio).toLocaleString("es-AR"))}</span>
          </div>
          <div class="voucher-row">
            <span class="voucher-label">Estado:</span>
            <span class="voucher-value voucher-status-badge">Confirmado</span>
          </div>
        </div>

        <div class="voucher-footer">
          Galería La Catedral, San Carlos de Bariloche
        </div>
      </div>

      <div class="voucher-actions-group">
        <button type="button" id="btn-descargar-png" class="btn btn-primary btn-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Descargar imagen</span>
        </button>
        <button type="button" id="btn-descargar-pdf" class="btn btn-secondary btn-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span>Descargar PDF</span>
        </button>
        <button type="button" id="btn-compartir-whatsapp" class="btn btn-secondary btn-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .15 5.35.15 11.91c0 2.1.55 4.15 1.59 5.96L.05 24l6.27-1.64a11.88 11.88 0 0 0 5.74 1.47h.01c6.56 0 11.91-5.35 11.91-11.91 0-3.18-1.24-6.17-3.46-8.44ZM12.07 21.82h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.72.97.99-3.63-.23-.37a9.88 9.88 0 0 1-1.51-5.29C2.2 6.46 6.63 2.03 12.07 2.03c2.63 0 5.1 1.03 6.96 2.9a9.82 9.82 0 0 1 2.89 6.98c0 5.44-4.43 9.87-9.85 9.91Zm5.41-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.09 4.5.71.31 1.26.5 1.69.64.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"/></svg>
          <span>Compartir por WhatsApp</span>
        </button>
      </div>
    `;

    // 1. Descargar imagen PNG con html2canvas
    const btnPng = document.getElementById("btn-descargar-png");
    if (btnPng) {
      btnPng.addEventListener("click", async () => {
        const card = document.getElementById("voucher-comprobante-card");
        if (!card) return;
        btnPng.disabled = true;
        const originalText = btnPng.innerHTML;
        btnPng.textContent = "Generando imagen...";

        try {
          if (typeof html2canvas === "function") {
            const canvas = await html2canvas(card, {
              scale: 2,
              useCORS: true,
              backgroundColor: "#160D09"
            });
            const link = document.createElement("a");
            link.download = `turno-marian-estilista-${fechaIso}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            window.showToast?.("✓ Imagen descargada correctamente", "success");
          } else {
            window.showToast?.("Biblioteca de imagen no cargada. Intentá nuevamente.", "warning");
          }
        } catch (e) {
          console.error("Error al descargar PNG:", e);
          window.showToast?.("No se pudo generar la imagen del comprobante.", "danger");
        } finally {
          btnPng.disabled = false;
          btnPng.innerHTML = originalText;
        }
      });
    }

    // 2. Descargar documento PDF
    const btnPdf = document.getElementById("btn-descargar-pdf");
    if (btnPdf) {
      btnPdf.addEventListener("click", async () => {
        const card = document.getElementById("voucher-comprobante-card");
        if (!card) return;
        btnPdf.disabled = true;
        const originalText = btnPdf.innerHTML;
        btnPdf.textContent = "Generando PDF...";

        try {
          if (typeof html2canvas === "function") {
            const canvas = await html2canvas(card, {
              scale: 2,
              useCORS: true,
              backgroundColor: "#160D09"
            });
            const imgData = canvas.toDataURL("image/png");

            const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (jsPDF) {
              const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
              });
              const pdfWidth = pdf.internal.pageSize.getWidth() - 40;
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
              pdf.addImage(imgData, "PNG", 20, 20, pdfWidth, pdfHeight);
              pdf.save(`turno-marian-estilista-${fechaIso}.pdf`);
              window.showToast?.("✓ PDF descargado correctamente", "success");
            } else {
              // Fallback de impresión
              const win = window.open("", "_blank");
              win.document.write(`<html><head><title>Turno Marian Estilista</title></head><body style="margin:0;display:flex;justify-content:center;background:#120A07;"><img src="${imgData}" style="max-width:100%;"></body></html>`);
              win.document.close();
              win.focus();
              win.print();
            }
          }
        } catch (e) {
          console.error("Error al descargar PDF:", e);
          window.showToast?.("No se pudo generar el archivo PDF.", "danger");
        } finally {
          btnPdf.disabled = false;
          btnPdf.innerHTML = originalText;
        }
      });
    }

    // 3. Compartir por WhatsApp (Web Share API en móviles con imagen, WhatsApp Web en desktop)
    const btnWa = document.getElementById("btn-compartir-whatsapp");
    if (btnWa) {
      btnWa.addEventListener("click", async () => {
        const mensajeWa = `✨ *MARIAN ESTILISTA — TURNO CONFIRMADO* ✨\n\n` +
          `👤 *Cliente:* ${clienteNombre}\n` +
          `💇‍♀️ *Servicio:* ${servicioNombre}\n` +
          `✂️ *Profesional:* ${profesionalNombre}\n` +
          `📅 *Fecha:* ${dateFormatted}\n` +
          `⏰ *Hora:* ${hora} hs (${duracionMinutos} min)\n` +
          `💰 *Precio:* ${turno.precioTexto || this.state.servicio?.precioTexto || ('$' + Number(precio).toLocaleString("es-AR"))}\n` +
          `📍 *Lugar:* Galería La Catedral, San Carlos de Bariloche\n\n` +
          `¡Te esperamos en nuestro salón!`;

        const card = document.getElementById("voucher-comprobante-card");

        // Intentar compartir archivo en móviles si Web Share API lo soporta
        if (navigator.share && card && typeof html2canvas === "function") {
          try {
            const canvas = await html2canvas(card, { scale: 2, useCORS: true, backgroundColor: "#160D09" });
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            if (blob) {
              const file = new File([blob], `turno-marian-estilista-${fechaIso}.png`, { type: "image/png" });
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: "Turno Confirmado - Marian Estilista",
                  text: mensajeWa,
                  files: [file]
                });
                return;
              }
            }
          } catch (errShare) {
            console.log("Web Share API no disponible para archivos:", errShare);
          }
        }

        // WhatsApp Web en desktop o dispositivos sin Web Share de archivos
        const waUrl = `https://wa.me/?text=${encodeURIComponent(mensajeWa)}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");
        window.showToast?.("Abriendo WhatsApp con el mensaje de tu turno.", "info");
      });
    }
  }

  // ==========================================
  // NAVEGACIÓN Y CONTROL DEL WIZARD
  // ==========================================
  async handleNextClick() {
    switch (this.currentStep) {
      case 1:
        if (!this.state.servicio) {
          this.showToast("Por favor selecciona un servicio.", "warning");
          return;
        }
        this.currentStep = 2;
        this.renderCalendar();
        break;

      case 2:
        if (!this.state.fecha) {
          this.showToast("Por favor selecciona una fecha en el calendario.", "warning");
          return;
        }
        this.currentStep = 3;
        await this.renderSlots();
        break;

      case 3:
        if (!this.state.hora) {
          this.showToast("Por favor selecciona un horario disponible.", "warning");
          return;
        }
        this.currentStep = 4;
        break;

      case 4:
        if (!this.validateClientForm()) {
          return;
        }
        this.currentStep = 5;
        this.renderSummary();
        break;

      case 5:
        await this.confirmBooking();
        return;

      default:
        break;
    }

    this.updateStepUI();
  }

  goToPrevStep() {
    if (this.currentStep > 1 && this.currentStep < 6) {
      this.currentStep -= 1;
      this.updateStepUI();
    }
  }

  goToStep(stepNum) {
    if (stepNum >= 1 && stepNum <= this.totalSteps) {
      this.currentStep = stepNum;
      this.updateStepUI();
    }
  }

  updateStepUI() {
    // 1. Actualizar barra de progreso del stepper
    const progressPercent = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
    if (this.stepperFill) {
      this.stepperFill.style.width = `${progressPercent}%`;
    }

    // 2. Actualizar círculos del stepper
    this.stepItems.forEach(item => {
      const stepNum = parseInt(item.getAttribute("data-step"));
      item.classList.remove("active", "completed");

      if (stepNum === this.currentStep) {
        item.classList.add("active");
      } else if (stepNum < this.currentStep) {
        item.classList.add("completed");
      }
    });

    // 3. Mostrar el contenido del paso actual
    this.stepContents.forEach(content => {
      const stepNum = parseInt(content.getAttribute("data-step-content"));
      if (stepNum === this.currentStep) {
        content.classList.add("active");
      } else {
        content.classList.remove("active");
      }
    });

    // 4. Controlar botones de pie (Atrás / Siguiente)
    if (this.currentStep === 1) {
      this.btnBack.style.visibility = "hidden";
      this.btnNext.style.display = "inline-flex";
      this.btnNext.textContent = "Continuar →";
      this.btnNext.disabled = !this.state.servicio;
    } else if (this.currentStep === 2) {
      this.btnBack.style.visibility = "visible";
      this.btnNext.style.display = "inline-flex";
      this.btnNext.textContent = "Continuar →";
      this.btnNext.disabled = !this.state.fecha;
    } else if (this.currentStep === 3) {
      this.btnBack.style.visibility = "visible";
      this.btnNext.style.display = "inline-flex";
      this.btnNext.textContent = "Continuar →";
      this.btnNext.disabled = !this.state.hora;
    } else if (this.currentStep === 4) {
      this.btnBack.style.visibility = "visible";
      this.btnNext.style.display = "inline-flex";
      this.btnNext.textContent = "Revisar Resumen →";
      this.btnNext.disabled = false;

      // Autocompletar datos del cliente si tiene sesión iniciada
      if (typeof window.apiGetCurrentUser === "function") {
        window.apiGetCurrentUser().then(user => {
          if (user) {
            const nom = document.getElementById("cli-nombre");
            const ape = document.getElementById("cli-apellido");
            const tel = document.getElementById("cli-telefono");
            const eml = document.getElementById("cli-email");
            if (nom && !nom.value) nom.value = user.nombre || "";
            if (ape && !ape.value) ape.value = user.apellido || "";
            if (tel && !tel.value) tel.value = user.telefono || "";
            if (eml && !eml.value) eml.value = user.email || "";
          }
        });
      }
    } else if (this.currentStep === 5) {
      this.btnBack.style.visibility = "visible";
      this.btnNext.style.display = "inline-flex";
      this.btnNext.textContent = "✨ Confirmar Turno";
      this.btnNext.disabled = false;
    } else if (this.currentStep === 6) {
      // En confirmación ocultamos los botones del wizard
      if (this.wizardFooter) {
        this.wizardFooter.style.display = "none";
      }
    }

    // Scroll arriba suave al cambiar de paso
    window.scrollTo({ top: 80, behavior: "smooth" });
  }

  showToast(message, type = "info") {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.bookingWizard = new BookingWizard();
});
