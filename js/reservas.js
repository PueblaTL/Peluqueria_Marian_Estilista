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
    this.checkUrlParams();
    this.updateStepUI();
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
      this.profesional = await window.StorageService.getProfesional();
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
      const servicios = await window.StorageService.getServicios(true);
      const matched = servicios.find(s => s.id === serviceParam);
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
      Cargando servicios...
    </div>
  `;

    const servicios = await window.StorageService.getServicios(true);

    if (!servicios || servicios.length === 0) {
      this.servicesContainer.innerHTML = `
      <p>No hay servicios disponibles actualmente.</p>
    `;
      return;
    }

    this.servicesContainer.innerHTML = "";

    servicios.forEach(s => {
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
            $${Number(s.precio).toLocaleString("es-AR")}
          </span>
        </div>

        <p class="book-srv-desc">
          ${s.descripcion}
        </p>

        <div class="book-srv-meta">

          <span class="book-srv-duration">
            ⏱ ${s.duracionMinutos} min
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
  renderCalendar() {
    if (!this.calendarDaysGrid || !this.calendarMonthTitle) return;

    const year = this.calCurrentDate.getFullYear();
    const month = this.calCurrentDate.getMonth();

    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    this.calendarMonthTitle.textContent = `${monthNames[month]} ${year}`;

    // Validar botón de mes anterior (no ir al pasado)
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    if (this.calPrevBtn) {
      this.calPrevBtn.disabled = isCurrentMonth;
    }

    this.calendarDaysGrid.innerHTML = "";

    // Primer día del mes (0: Domingo, 1: Lunes, etc.)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Cantidad de días en el mes
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
      const dayOfWeek = dateObj.getDay(); // 0 Dom, 1 Lun, 2 Mar, ..., 6 Sáb

      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      // Reglas de disponibilidad:
      // Atención: Martes (2) a Sábado (6). Domingo (0) y Lunes (1) cerrado.
      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isWorkingDay = dayOfWeek >= 2 && dayOfWeek <= 6;
      const isAvailable = !isPast && isWorkingDay;

      cell.className = "calendar-day-cell";
      cell.textContent = day;
      cell.setAttribute("data-date", dateString);

      if (isPast) {
        cell.classList.add("past");
      } else if (!isWorkingDay) {
        cell.classList.add("closed");
        cell.title = "Cerrado (Atención Martes a Sábados)";
      } else {
        cell.classList.add("available");

        if (this.state.fecha === dateString) {
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
    this.state.fecha = dateString;

    document.querySelectorAll(".calendar-day-cell.available").forEach(c => {
      if (c.getAttribute("data-date") === dateString) {
        c.classList.add("selected");
      } else {
        c.classList.remove("selected");
      }
    });

    this.btnNext.disabled = false;
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
      const duracion = this.state.servicio?.duracionMinutos || 60;
      const slots = await window.StorageService.getDisponibilidad(this.state.fecha, duracion);

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
  // PASO 4: FORMULARIO CLIENTE
  // ==========================================
  validateClientForm() {
    const nombre = document.getElementById("cli-nombre").value.trim();
    const apellido = document.getElementById("cli-apellido").value.trim();
    const telefono = document.getElementById("cli-telefono").value.trim();
    const email = document.getElementById("cli-email").value.trim();
    const notas = document.getElementById("cli-notas").value.trim();

    if (!nombre || !apellido || !telefono || !email) {
      this.showToast("Por favor completa todos los campos requeridos (*).", "warning");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showToast("Por favor ingresa un correo electrónico válido.", "danger");
      return false;
    }

    if (telefono.length < 7) {
      this.showToast("Por favor ingresa un número de teléfono válido.", "danger");
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
          <span class="ticket-price-val">$${Number(this.state.servicio?.precio).toLocaleString("es-AR")}</span>
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
          <span class="ticket-meta-val">${this.state.hora} hs (${this.state.servicio?.duracionMinutos} min)</span>
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
      const nuevoTurno = await window.StorageService.saveTurno({
        servicioId: this.state.servicio.id,
        servicioNombre: this.state.servicio.nombre,
        fecha: this.state.fecha,
        hora: this.state.hora,
        duracionMinutos: this.state.servicio.duracionMinutos,
        precio: this.state.servicio.precio,
        cliente: this.state.cliente
      });

      this.state.turnoConfirmado = nuevoTurno;

      // Renderizar confirmación
      this.renderConfirmation(nuevoTurno);

      // Avanzar al paso 6
      this.currentStep = 6;
      this.updateStepUI();
      this.showToast("✨ ¡Turno reservado exitosamente!", "success");
    } catch (err) {
      console.error("Error al confirmar turno:", err);
      this.showToast("Ocurrió un error al registrar el turno. Inténtalo nuevamente.", "danger");
      this.btnNext.disabled = false;
      this.btnNext.textContent = "Confirmar Turno";
    }
  }

  renderConfirmation(turno) {
    if (!this.confirmationContainer) return;

    const [y, m, d] = (turno.fecha || "").split("-").map(Number);
    const dateFormatted = new Date(y, m - 1, d).toLocaleDateString("es-AR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    this.confirmationContainer.innerHTML = `
      <div class="conf-id-row">
        <span>Código de Turno:</span>
        <strong>#${turno.id}</strong>
      </div>
      <div class="conf-details-grid">
        <div>
          <span>Servicio:</span>
          <strong>${turno.servicioNombre}</strong>
        </div>
        <div>
          <span>Profesional:</span>
          <strong>Mariano</strong>
        </div>
        <div>
          <span>Fecha y Hora:</span>
          <strong>${dateFormatted} a las ${turno.hora} hs</strong>
        </div>
        <div>
          <span>Clienta:</span>
          <strong>${turno.cliente.nombre} ${turno.cliente.apellido}</strong>
        </div>
        <div>
          <span>Total Estimado:</span>
          <strong>$${Number(turno.precio).toLocaleString("es-AR")}</strong>
        </div>
        <div>
          <span>Ubicación:</span>
          <strong>Galería La Catedral, San Carlos de Bariloche – Salón Marian Estilista</strong>
        </div>
      </div>
    `;
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
