/**
 * admin.js - Lógica Interactiva del Panel de Administración de Marian Estilista
 */

class AdminDashboard {
  constructor() {
    this.currentTab = "dashboard";
    this.init();
  }

  async init() {
    // Verificar rol de Administrador en backend
    if (typeof window.apiGetCurrentUser === "function") {
      const user = await window.apiGetCurrentUser();
      if (!user || user.rol !== "ADMIN") {
        if (typeof window.showToast === "function") {
          window.showToast("Acceso denegado: se requieren permisos de Administrador.", "danger");
        }
        setTimeout(() => {
          window.location.href = "login.html?redirect=admin.html";
        }, 800);
        return;
      }
    }

    // 1. Inicializar almacenamiento
    if (window.StorageService) {
      window.StorageService.init();
    }

    this.cacheDom();
    this.bindEvents();
    this.initDateBadge();
    await this.loadAllData();
  }

  cacheDom() {
    this.navItems = document.querySelectorAll(".admin-nav-item");
    this.tabPanes = document.querySelectorAll(".admin-tab-pane");
    this.topbarTitle = document.getElementById("admin-topbar-title");
    this.dateBadge = document.getElementById("admin-current-date");
    this.sidebar = document.querySelector(".admin-sidebar") || document.getElementById("admin-sidebar");
    this.sidebarOverlay = document.getElementById("admin-sidebar-overlay");
    this.sidebarCloseBtn = document.getElementById("sidebar-close-btn");
    this.mobileToggle = document.getElementById("admin-sidebar-toggle");

    // KPIs
    this.kpiTurnosHoy = document.getElementById("kpi-turnos-hoy");
    this.kpiTurnosPendientes = document.getElementById("kpi-turnos-pendientes");
    this.kpiTurnosCompletados = document.getElementById("kpi-turnos-completados");
    this.kpiTotalClientes = document.getElementById("kpi-total-clientes");
    this.kpiIngresosEstimados = document.getElementById("kpi-ingresos-estimados");
    this.kpiTotalInscripciones = document.getElementById("kpi-total-inscripciones");

    // Tablas y Contenedores
    this.dashboardRecentTurnosTable = document.getElementById("dashboard-recent-turnos-tbody");
    this.turnosTableBody = document.getElementById("admin-turnos-tbody");
    this.clientesTableBody = document.getElementById("admin-clientes-tbody");
    this.serviciosGrid = document.getElementById("admin-services-grid");
    this.cursoInscriptosTable = document.getElementById("admin-curso-inscriptos-tbody");

    // Filtros de Turnos
    this.turnosSearchInput = document.getElementById("turnos-search-input");
    this.turnosStatusFilter = document.getElementById("turnos-status-filter");
    this.turnosDateFilter = document.getElementById("turnos-date-filter");

    // Modales
    this.serviceModal = document.getElementById("modal-servicio-crud");
    this.serviceForm = document.getElementById("form-servicio-crud");
    this.btnOpenNewService = document.getElementById("btn-nuevo-servicio");
    this.btnCloseServiceModal = document.getElementById("btn-close-service-modal");
    this.btnCancelServiceModal = document.getElementById("btn-cancel-service-modal");

    // Modal Inscripción Curso
    this.btnOpenNewInscripcion = document.getElementById("btn-nueva-inscripcion");
    this.inscripcionModal = document.getElementById("modal-inscripcion-manual");
    this.inscripcionForm = document.getElementById("form-inscripcion-manual");
    this.btnCloseInscripcionModal = document.getElementById("btn-close-inscripcion-modal");
    this.btnCancelInscripcionModal = document.getElementById("btn-cancel-inscripcion-modal");
  }

  openSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.add("open");
    }
    if (this.sidebarOverlay) {
      this.sidebarOverlay.classList.add("active");
    }
    if (this.mobileToggle) {
      this.mobileToggle.setAttribute("aria-expanded", "true");
    }
    document.body.style.overflow = "hidden";
  }

  closeSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.remove("open");
    }
    if (this.sidebarOverlay) {
      this.sidebarOverlay.classList.remove("active");
    }
    if (this.mobileToggle) {
      this.mobileToggle.setAttribute("aria-expanded", "false");
    }
    document.body.style.overflow = "";
  }

  toggleSidebar() {
    if (this.sidebar && this.sidebar.classList.contains("open")) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  bindEvents() {
    // Navegación por pestañas
    this.navItems.forEach(item => {
      item.addEventListener("click", () => {
        const targetTab = item.getAttribute("data-tab");
        if (targetTab) {
          this.switchTab(targetTab);
        }
      });
      // Accesibilidad teclado
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click();
        }
      });
    });

    // Control centralizado del Sidebar y Overlay móvil
    if (this.mobileToggle) {
      this.mobileToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleSidebar();
      });
    }

    if (this.sidebarCloseBtn) {
      this.sidebarCloseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeSidebar();
      });
    }

    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    // Cerrar sidebar con ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.sidebar && this.sidebar.classList.contains("open")) {
        this.closeSidebar();
      }
    });

    // Filtros de tabla de turnos
    if (this.turnosSearchInput) {
      this.turnosSearchInput.addEventListener("input", () => this.filterTurnosTable());
    }
    if (this.turnosStatusFilter) {
      this.turnosStatusFilter.addEventListener("change", () => this.filterTurnosTable());
    }
    if (this.turnosDateFilter) {
      this.turnosDateFilter.addEventListener("change", () => this.filterTurnosTable());
    }

    // Modal de Servicios
    if (this.btnOpenNewService) {
      this.btnOpenNewService.addEventListener("click", () => this.openServiceModal());
    }
    if (this.btnCloseServiceModal) {
      this.btnCloseServiceModal.addEventListener("click", () => this.closeServiceModal());
    }
    if (this.btnCancelServiceModal) {
      this.btnCancelServiceModal.addEventListener("click", () => this.closeServiceModal());
    }

    if (this.serviceForm) {
      this.serviceForm.addEventListener("submit", (e) => this.handleServiceFormSubmit(e));
    }

    // Modal Inscripción Manual al Curso
    if (this.btnOpenNewInscripcion) {
      this.btnOpenNewInscripcion.addEventListener("click", () => this.openInscripcionModal());
    }
    if (this.btnCloseInscripcionModal) {
      this.btnCloseInscripcionModal.addEventListener("click", () => this.closeInscripcionModal());
    }
    if (this.btnCancelInscripcionModal) {
      this.btnCancelInscripcionModal.addEventListener("click", () => this.closeInscripcionModal());
    }
    if (this.inscripcionModal) {
      this.inscripcionModal.addEventListener("click", (e) => {
        if (e.target === this.inscripcionModal) this.closeInscripcionModal();
      });
    }
    if (this.inscripcionForm) {
      this.inscripcionForm.addEventListener("submit", (e) => this.handleSaveInscripcion(e));
    }

    // Botón de restablecer datos demo
    const btnResetDemo = document.getElementById("btn-reset-demo-data");
    if (btnResetDemo) {
      btnResetDemo.addEventListener("click", () => this.handleResetDemo());
    }
  }

  initDateBadge() {
    if (this.dateBadge) {
      const now = new Date();
      const options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
      const dateStr = now.toLocaleDateString("es-AR", options);
      this.dateBadge.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Actualizar sidebar activo
    this.navItems.forEach(item => {
      if (item.getAttribute("data-tab") === tabName) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Actualizar panel de contenido
    this.tabPanes.forEach(pane => {
      if (pane.id === `tab-${tabName}`) {
        pane.classList.add("active");
      } else {
        pane.classList.remove("active");
      }
    });

    // Actualizar título en topbar
    const titlesMap = {
      dashboard: "Dashboard General",
      turnos: "Administración de Turnos",
      clientes: "Directorio de Clientas",
      servicios: "Catálogo de Servicios Femeninos",
      curso: "Curso Profesional & Inscripciones",
      configuracion: "Configuración del Negocio"
    };

    if (this.topbarTitle) {
      this.topbarTitle.textContent = titlesMap[tabName] || "Panel de Administración";
    }

    // Cerrar sidebar en móvil (con overlay)
    this.closeSidebar();

    // Recargar datos relevantes
    this.loadAllData();
  }

  async loadAllData() {
    await Promise.all([
      this.loadDashboardStats(),
      this.loadTurnosTable(),
      this.loadClientesTable(),
      this.loadServicesGrid(),
      this.loadCursoInscriptosTable()
    ]);
  }

  // ==========================================
  // 1. DASHBOARD & KPIS
  // ==========================================
  async loadDashboardStats() {
    let stats = null;
    if (typeof window.apiGetStats === "function") {
      try {
        stats = await window.apiGetStats();
      } catch (e) {
        console.warn("[Admin] Fallback a StorageService para stats:", e);
      }
    }
    if (!stats) {
      stats = await window.StorageService.getDashboardStats();
    }

    if (this.kpiTurnosHoy) this.kpiTurnosHoy.textContent = stats.turnosHoy ?? 0;
    if (this.kpiTurnosPendientes) this.kpiTurnosPendientes.textContent = stats.turnosPendientes ?? 0;
    if (this.kpiTurnosCompletados) this.kpiTurnosCompletados.textContent = stats.turnosCompletados ?? 0;
    if (this.kpiTotalClientes) this.kpiTotalClientes.textContent = stats.totalClientes ?? 0;
    if (this.kpiIngresosEstimados) {
      const ing = Number(stats.ingresosEstimados || 0);
      this.kpiIngresosEstimados.textContent = `$${ing.toLocaleString("es-AR")}`;
    }
    if (this.kpiTotalInscripciones) this.kpiTotalInscripciones.textContent = stats.inscripcionesCurso ?? 0;

    // Tabla rápida de turnos recientes en Dashboard
    if (this.dashboardRecentTurnosTable) {
      let turnos = [];
      if (typeof window.apiObtenerReservas === "function") {
        try {
          turnos = await window.apiObtenerReservas();
        } catch (e) {
          turnos = await window.StorageService.getTurnos();
        }
      } else {
        turnos = await window.StorageService.getTurnos();
      }
      const recientes = (turnos || []).slice(0, 5);

      if (recientes.length === 0) {
        this.dashboardRecentTurnosTable.innerHTML = `<tr><td colspan="7" class="text-center">No hay turnos registrados aún.</td></tr>`;
        return;
      }

      this.dashboardRecentTurnosTable.innerHTML = recientes.map(t => {
        const clienteNombre = t.cliente?.nombre ? `${t.cliente.nombre} ${t.cliente.apellido || ''}` : (t.cliente_nombre || 'Cliente');
        const clienteTel = t.cliente?.telefono || t.cliente_telefono || '';
        const servNombre = t.servicioNombre || t.servicio_nombre || 'Servicio';
        const profNombre = t.profesionalNombre || t.profesional_nombre || 'Marian';
        const precio = t.precioTexto || ('$' + Number(t.precio || 0).toLocaleString("es-AR"));
        const stUpper = String(t.estado || 'PENDIENTE').toUpperCase();
        const estadoLabel = stUpper === 'PENDIENTE' ? 'Pendiente' : (stUpper === 'CONFIRMADA' || stUpper === 'CONFIRMADO' ? 'Confirmada' : (stUpper === 'COMPLETADA' || stUpper === 'COMPLETADO' ? 'Completada' : 'Cancelada'));
        const estadoClass = stUpper === 'PENDIENTE' ? 'pendiente' : (stUpper === 'CONFIRMADA' || stUpper === 'CONFIRMADO' ? 'confirmado' : (stUpper === 'COMPLETADA' || stUpper === 'COMPLETADO' ? 'completado' : 'cancelado'));

        return `
        <tr>
          <td data-label="Fecha &amp; Hora">
            <strong>${t.fecha}</strong><br>
            <span class="text-muted">${t.hora} hs</span>
          </td>
          <td data-label="Clienta">
            <strong>${clienteNombre}</strong><br>
            <span class="text-muted">${clienteTel}</span>
          </td>
          <td data-label="Servicio">${servNombre}</td>
          <td data-label="Profesional"><strong>${profNombre}</strong></td>
          <td data-label="Precio"><strong>${precio}</strong></td>
          <td data-label="Estado"><span class="status-badge status-${estadoClass}">${estadoLabel}</span></td>
          <td data-label="Acciones">
            <div class="action-buttons-group">
              ${stUpper === 'PENDIENTE' ? `<button class="btn-action btn-act-confirm" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Confirmada')" title="Confirmar" aria-label="Confirmar turno">✓</button>` : ''}
              ${stUpper !== 'COMPLETADA' && stUpper !== 'COMPLETADO' && stUpper !== 'CANCELADA' && stUpper !== 'CANCELADO' ? `<button class="btn-action btn-act-complete" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Completada')" title="Completar" aria-label="Completar turno">★</button>` : ''}
              ${stUpper !== 'CANCELADA' && stUpper !== 'CANCELADO' ? `<button class="btn-action btn-act-cancel" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Cancelada')" title="Cancelar" aria-label="Cancelar turno">✕</button>` : ''}
            </div>
          </td>
        </tr>
      `;
      }).join("");
    }
  }

  // ==========================================
  // 2. TABLA DE TURNOS
  // ==========================================
  async loadTurnosTable() {
    if (!this.turnosTableBody) return;

    const filtros = {
      search: this.turnosSearchInput ? this.turnosSearchInput.value.trim() : "",
      estado: this.turnosStatusFilter ? this.turnosStatusFilter.value : "todos",
      fecha: this.turnosDateFilter ? this.turnosDateFilter.value : ""
    };

    let turnos = [];
    if (typeof window.apiObtenerReservas === "function") {
      try {
        turnos = await window.apiObtenerReservas(filtros);
      } catch (e) {
        console.warn("[Admin] Fallback a StorageService para turnos:", e);
        turnos = await window.StorageService.getTurnos(filtros);
      }
    } else {
      turnos = await window.StorageService.getTurnos(filtros);
    }

    if (turnos.length === 0) {
      this.turnosTableBody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 30px;">No se encontraron turnos con los filtros seleccionados.</td></tr>`;
      return;
    }

    this.turnosTableBody.innerHTML = turnos.map(t => {
      const dur = t.duracionMinutos || t.duracion_minutos || 60;
      const srvNombre = t.servicioNombre || t.servicio_nombre || "Servicio";
      const clienteNombre = t.cliente?.nombre ? `${t.cliente.nombre} ${t.cliente.apellido || ''}` : (t.cliente_nombre || 'Cliente');
      const clienteTel = t.cliente?.telefono || t.cliente_telefono || '';
      const clienteEmail = t.cliente?.email || t.cliente_email || '';
      const notas = t.cliente?.notas || t.observaciones || '';
      const stUpper = String(t.estado || 'PENDIENTE').toUpperCase();
      const estadoLabel = stUpper === 'PENDIENTE' ? 'Pendiente' : (stUpper === 'CONFIRMADA' || stUpper === 'CONFIRMADO' ? 'Confirmada' : (stUpper === 'COMPLETADA' || stUpper === 'COMPLETADO' ? 'Completada' : 'Cancelada'));
      const estadoClass = stUpper === 'PENDIENTE' ? 'pendiente' : (stUpper === 'CONFIRMADA' || stUpper === 'CONFIRMADO' ? 'confirmado' : (stUpper === 'COMPLETADA' || stUpper === 'COMPLETADO' ? 'completado' : 'cancelado'));

      return `
      <tr>
        <td data-label="ID"><code>#${String(t.id).slice(-5)}</code></td>
        <td data-label="Fecha &amp; Hora">
          <strong>${t.fecha}</strong><br>
          <span class="text-muted">${t.hora} hs (${dur} min)</span>
        </td>
        <td data-label="Clienta">
          <strong>${clienteNombre}</strong>
          ${notas ? `<br><small class="text-muted" title="${notas}">📝 ${notas.slice(0, 24)}...</small>` : ''}
        </td>
        <td data-label="Contacto">
          <a href="tel:${clienteTel}" class="contact-link">📱 ${clienteTel || 'Sin teléfono'}</a><br>
          <span class="text-muted">✉️ ${clienteEmail || 'Sin email'}</span>
        </td>
        <td data-label="Servicio"><strong>${srvNombre}</strong></td>
        <td data-label="Profesional">Marian</td>
        <td data-label="Precio"><strong>${t.precioTexto || ('$' + Number(t.precio || 0).toLocaleString("es-AR"))}</strong></td>
        <td data-label="Estado"><span class="status-badge status-${estadoClass}">${estadoLabel}</span></td>
        <td data-label="Acciones">
          <div class="action-buttons-group">
            ${stUpper === 'PENDIENTE' ? `
              <button class="btn btn-sm btn-action-pill btn-pill-confirm" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Confirmada')" aria-label="Confirmar turno">
                Confirmar
              </button>
            ` : ''}
            ${stUpper === 'CONFIRMADA' || stUpper === 'CONFIRMADO' ? `
              <button class="btn btn-sm btn-action-pill btn-pill-complete" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Completada')" aria-label="Completar turno">
                Completar
              </button>
            ` : ''}
            ${stUpper !== 'CANCELADA' && stUpper !== 'CANCELADO' ? `
              <button class="btn btn-sm btn-action-pill btn-pill-cancel" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Cancelada')" aria-label="Cancelar turno">
                Cancelar
              </button>
            ` : `
              <button class="btn btn-sm btn-action-pill btn-pill-delete" onclick="window.adminDashboard.eliminarTurno('${t.id}')" aria-label="Eliminar turno">
                Eliminar
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
    }).join("");
  }

  filterTurnosTable() {
    this.loadTurnosTable();
  }

  async cambiarEstadoTurno(id, nuevoEstado) {
    try {
      if (typeof window.apiActualizarEstadoReserva === "function") {
        await window.apiActualizarEstadoReserva(id, nuevoEstado);
      } else {
        await window.StorageService.updateTurnoEstado(id, nuevoEstado);
      }
      try {
        await window.StorageService.updateTurnoEstado(id, nuevoEstado);
      } catch (e) {}
      this.showToast(`Turno actualizado a estado "${nuevoEstado}".`, "success");
      await this.loadAllData();
    } catch (err) {
      console.error(err);
      this.showToast("Error al actualizar turno.", "danger");
    }
  }

  async eliminarTurno(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este turno definitivamente?")) return;
    try {
      if (typeof window.apiCancelarReserva === "function") {
        await window.apiCancelarReserva(id);
      } else {
        await window.StorageService.deleteTurno(id);
      }
      try {
        await window.StorageService.deleteTurno(id);
      } catch (e) {}
      this.showToast("Turno eliminado con éxito.", "success");
      await this.loadAllData();
    } catch (err) {
      console.error(err);
      this.showToast("Error al eliminar turno.", "danger");
    }
  }

  // ==========================================
  // 3. TABLA DE CLIENTES
  // ==========================================
  async loadClientesTable() {
    if (!this.clientesTableBody) return;

    let clientes = null;
    if (typeof window.apiGetClientes === "function") {
      try {
        clientes = await window.apiGetClientes();
      } catch (e) {
        console.warn("[Admin] Fallback a StorageService para clientes:", e);
      }
    }
    if (!clientes) {
      clientes = await window.StorageService.getClientes();
    }

    if (!clientes || clientes.length === 0) {
      this.clientesTableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 30px;">No hay clientas registradas aún.</td></tr>`;
      return;
    }

    this.clientesTableBody.innerHTML = clientes.map(c => {
      const nom = c.nombre || "Cliente";
      const ape = c.apellido || "";
      const tel = c.telefono || "Sin teléfono";
      const email = c.email || "Sin email";
      const cant = Number(c.cantidadTurnos || 0);
      const ult = c.ultimoTurno || "Sin turnos";
      const iniciales = `${nom.charAt(0)}${ape ? ape.charAt(0) : ''}`.toUpperCase();

      return `
      <tr>
        <td>
          <div class="client-avatar-cell">
            <div class="client-avatar-circle">${iniciales}</div>
            <div>
              <strong>${nom} ${ape}</strong>
            </div>
          </div>
        </td>
        <td><a href="tel:${tel}">📱 ${tel}</a></td>
        <td>✉️ ${email}</td>
        <td><span class="count-badge">${cant} ${cant === 1 ? 'turno' : 'turnos'}</span></td>
        <td>${ult}</td>
        <td>
          ${cant >= 3
        ? `<span class="badge-gold">👑 Clienta Frecuente</span>`
        : `<span class="badge-regular">Cliente Estándar</span>`}
        </td>
      </tr>
    `;
    }).join("");
  }

  // ==========================================
  // 4. CRUD DE SERVICIOS
  // ==========================================
  async loadServicesGrid() {
    if (!this.serviciosGrid) return;

    let servicios = [];
    if (typeof window.apiGetServicios === "function") {
      try {
        servicios = await window.apiGetServicios(false);
      } catch (e) {
        console.warn("[Admin] Fallback a StorageService al cargar servicios:", e);
        servicios = await window.StorageService.getServicios();
      }
    } else {
      servicios = await window.StorageService.getServicios();
    }

    this.cachedServicios = servicios;

    this.serviciosGrid.innerHTML = servicios.map(s => {
      const duracion = s.duracionMinutos || s.duracion_minutos || 60;
      const imgSrc = (s.imagen && !s.imagen.startsWith("http") && !s.imagen.startsWith("data:"))
        ? (s.imagen.startsWith("../") ? s.imagen : `../${s.imagen}`)
        : s.imagen;

      return `
      <div class="admin-srv-card ${!s.activo ? 'inactive' : ''}">
        <div class="admin-srv-img-wrap">
          <img src="${imgSrc}" alt="${s.nombre}" />
          <span class="admin-srv-badge">${s.categoria || 'Servicio'}</span>
          ${!s.activo ? `<span class="admin-srv-inactive-badge">Inactivo</span>` : ''}
        </div>
        <div class="admin-srv-body">
          <div class="admin-srv-top">
            <h4>${s.nombre}</h4>
            <span class="admin-srv-price">${s.precioTexto || ('$' + Number(s.precio).toLocaleString("es-AR"))}</span>
          </div>
          <p class="admin-srv-desc">${s.descripcion}</p>
          <div class="admin-srv-meta">
            <span>⏱ ${duracion} min</span>
            <div class="admin-srv-actions">
              <button class="btn btn-secondary btn-sm" onclick="window.adminDashboard.openEditServiceModal('${s.id}')">
                Editar
              </button>
              <button class="btn btn-sm ${s.activo ? 'btn-deactivate' : 'btn-activate'}" onclick="window.adminDashboard.toggleServiceState('${s.id}', ${!s.activo})">
                ${s.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    }).join("");
  }

  openServiceModal(servicio = null) {
    if (!this.serviceModal || !this.serviceForm) return;

    this.serviceForm.reset();
    const titleElem = document.getElementById("modal-service-title");
    const idInput = document.getElementById("crud-service-id");

    if (servicio) {
      titleElem.textContent = "Editar Servicio";
      idInput.value = servicio.id;
      document.getElementById("crud-service-nombre").value = servicio.nombre;
      document.getElementById("crud-service-categoria").value = servicio.categoria || "Iluminación";
      document.getElementById("crud-service-precio").value = servicio.precio;
      const ptInput = document.getElementById("crud-service-precio-texto");
      if (ptInput) ptInput.value = servicio.precioTexto || "";
      document.getElementById("crud-service-duracion").value = servicio.duracionMinutos || servicio.duracion_minutos || 60;
      document.getElementById("crud-service-activo").value = servicio.activo ? "true" : "false";
      document.getElementById("crud-service-desc").value = servicio.descripcion;
      document.getElementById("crud-service-img").value = servicio.imagen;
    } else {
      titleElem.textContent = "Agregar Nuevo Servicio";
      idInput.value = "";
      const ptInput = document.getElementById("crud-service-precio-texto");
      if (ptInput) ptInput.value = "";
    }

    this.serviceModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  async openEditServiceModal(id) {
    let servicio = null;
    if (this.cachedServicios) {
      servicio = this.cachedServicios.find(s => String(s.id) === String(id));
    }
    if (!servicio && typeof window.apiGetServicioById === "function") {
      try {
        servicio = await window.apiGetServicioById(id);
      } catch (e) {}
    }
    if (!servicio && window.StorageService) {
      servicio = await window.StorageService.getServicioById(id);
    }
    if (servicio) {
      this.openServiceModal(servicio);
    }
  }

  closeServiceModal() {
    if (this.serviceModal) {
      this.serviceModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  async handleServiceFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById("crud-service-id").value;
    const nombre = document.getElementById("crud-service-nombre").value.trim();
    const categoria = document.getElementById("crud-service-categoria").value;
    const precio = Number(document.getElementById("crud-service-precio").value);
    const ptInput = document.getElementById("crud-service-precio-texto");
    const precioTexto = ptInput && ptInput.value.trim() ? ptInput.value.trim() : undefined;
    const duracionMinutos = Number(document.getElementById("crud-service-duracion").value);
    const activo = document.getElementById("crud-service-activo").value === "true";
    const descripcion = document.getElementById("crud-service-desc").value.trim();
    let imagen = document.getElementById("crud-service-img").value.trim();

    if (!imagen) {
      imagen = "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80";
    }

    const payload = { 
      nombre, 
      categoria, 
      precio, 
      ...(precioTexto ? { precioTexto, precio_texto: precioTexto } : {}),
      duracion: duracionMinutos,
      duracionMinutos, 
      duracion_minutos: duracionMinutos, 
      activo, 
      descripcion, 
      imagen 
    };

    try {
      if (id) {
        if (typeof window.apiUpdateServicio === "function") {
          await window.apiUpdateServicio(id, payload);
        } else {
          await window.StorageService.updateServicio(id, payload);
        }
        this.showToast("Servicio actualizado correctamente.", "success");
      } else {
        if (typeof window.apiCreateServicio === "function") {
          await window.apiCreateServicio(payload);
        } else {
          await window.StorageService.saveServicio(payload);
        }
        this.showToast("Nuevo servicio agregado con éxito.", "success");
      }

      // Sincronizar en StorageService local como fallback
      try {
        if (id) {
          await window.StorageService.updateServicio(id, payload);
        } else {
          await window.StorageService.saveServicio(payload);
        }
      } catch (errLocal) {}

      this.closeServiceModal();
      await this.loadServicesGrid();
    } catch (err) {
      console.error(err);
      this.showToast("Error al guardar servicio: " + (err.message || ""), "danger");
    }
  }

  async toggleServiceState(id, nuevoEstado) {
    try {
      if (typeof window.apiUpdateServicio === "function") {
        await window.apiUpdateServicio(id, { activo: nuevoEstado });
      } else {
        await window.StorageService.updateServicio(id, { activo: nuevoEstado });
      }
      try {
        await window.StorageService.updateServicio(id, { activo: nuevoEstado });
      } catch (errLocal) {}

      this.showToast(`Servicio ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`, "info");
      await this.loadServicesGrid();
    } catch (err) {
      console.error(err);
      this.showToast("Error al cambiar estado del servicio.", "danger");
    }
  }

  // ==========================================
  // 5. CURSO & TABLA DE INSCRIPCIONES
  // ==========================================
  async loadCursoInscriptosTable() {
    if (!this.cursoInscriptosTable) return;

    const inscripciones = await window.StorageService.getInscripciones();

    if (inscripciones.length === 0) {
      this.cursoInscriptosTable.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 30px;">No hay postulantes registrados aún.</td></tr>`;
      return;
    }

    this.cursoInscriptosTable.innerHTML = inscripciones.map(ins => {
      const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
      const id = Number(ins.id);
      const estadoLabel = ins.estado === 'completado' ? 'Completado' : ins.estado;
      const certificadoAccion = ins.certificadoCodigo
        ? `<a class="btn btn-sm btn-action-pill" href="${escape(window.API_BASE)}/certificados/obtener.php?inscripcion_id=${id}" target="_blank" rel="noopener">Ver certificado</a>`
        : `<button class="btn btn-sm btn-action-pill" ${ins.estado === 'completado' && ins.fechaFinalizacion ? '' : 'disabled title="Completá el curso y guardá su fecha de finalización para generar el certificado."'} onclick="window.adminDashboard.generarCertificado(${id}, this)">Generar certificado</button>`;
      const dateStr = new Date(ins.fecha).toLocaleDateString("es-AR", {
        day: "numeric", month: "short", year: "numeric"
      });

      return `
        <tr>
          <td><strong>${dateStr}</strong></td>
          <td><strong>${escape(ins.nombre)} ${escape(ins.apellido)}</strong></td>
          <td><a href="tel:${escape(ins.telefono)}">📱 ${escape(ins.telefono)}</a></td>
          <td>✉️ ${escape(ins.email)}</td>
          <td>
            <span class="status-badge status-${escape(ins.estado.toLowerCase())}">${escape(estadoLabel)}</span>
            ${ins.fechaFinalizacion ? `<small class="fecha-finalizacion-resumen">Finalización: ${escape(ins.fechaFinalizacion.slice(0, 10).split('-').reverse().join('/'))}</small>` : ''}
          </td>
          <td>
            <div class="action-buttons-group">
              <select aria-label="Estado actual" data-estado="${escape(ins.estado)}" class="form-control form-control-sm" style="width: auto; display: inline-block;" onchange="window.adminDashboard.cambiarEstadoInscripcion(${id}, this.value, this)">
                <option value="Pendiente" ${ins.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="Contactado" ${ins.estado === 'Contactado' ? 'selected' : ''}>Contactado</option>
                <option value="Inscripto" ${ins.estado === 'Inscripto' ? 'selected' : ''}>Inscripto</option>
                <option value="completado" ${ins.estado === 'completado' ? 'selected' : ''}>Completado</option>
              </select>
              ${certificadoAccion}
              <button class="btn btn-sm btn-action-pill btn-pill-delete" onclick="window.adminDashboard.eliminarInscripcion(${id})">
                Eliminar
              </button>
            </div>
            <form class="fecha-finalizacion-form" id="finalizacion-${id}" ${ins.estado === 'completado' ? '' : 'hidden'} onsubmit="event.preventDefault(); window.adminDashboard.guardarFechaFinalizacion(${id}, this)">
              <label for="fecha-finalizacion-${id}">Fecha de finalización *</label>
              <input id="fecha-finalizacion-${id}" name="fecha_finalizacion" type="date" class="form-control form-control-sm" required min="1000-01-01" max="${this.hoyInscripciones()}" value="${escape((ins.fechaFinalizacion || '').slice(0, 10))}">
              ${ins.certificadoCodigo ? '<small>El certificado ya emitido conserva su fecha original.</small>' : ''}
              <div class="action-buttons-group">
                <button type="submit" class="btn btn-sm btn-primary">Guardar fecha y estado</button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="window.adminDashboard.loadCursoInscriptosTable()">Cancelar</button>
              </div>
            </form>
          </td>
        </tr>
      `;
    }).join("");
  }

  hoyInscripciones() {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' });
  }

  async guardarFechaFinalizacion(id, form) {
    if (!form.reportValidity()) return;
    const control = form.closest('tr').querySelector('select[data-estado]');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await this.cambiarEstadoInscripcion(id, 'completado', control, form.elements.fecha_finalizacion.value);
    } finally {
      button.disabled = false;
    }
  }

  async cambiarEstadoInscripcion(id, nuevoEstado, control, fechaFinalizacion = null) {
    if (nuevoEstado === 'completado' && fechaFinalizacion === null) {
      const form = document.getElementById(`finalizacion-${id}`);
      form.hidden = false;
      form.elements.fecha_finalizacion.focus();
      return;
    }
    if (control) control.disabled = true;
    try {
      await window.StorageService.updateInscripcionEstado(id, nuevoEstado, fechaFinalizacion);
      if (control) control.dataset.estado = nuevoEstado;
      await this.loadCursoInscriptosTable();
      this.showToast(nuevoEstado === 'completado'
        ? 'Fecha de finalización guardada. El alumno completó el curso.'
        : `Inscripción actualizada a "${nuevoEstado}".`, "success");
    } catch (err) {
      console.error(err);
      if (control) control.value = control.dataset.estado;
      this.showToast(err.message || "Error al actualizar inscripción.", "danger");
    } finally {
      if (control) control.disabled = false;
    }
  }

  async generarCertificado(id, button) {
    button.disabled = true;
    button.textContent = 'Generando…';
    try {
      await window.requestApi('/certificados/generar.php', {
        method: 'POST', body: { inscripcion_id: Number(id) }
      });
      await this.loadCursoInscriptosTable();
      this.showToast('Certificado generado. Ya podés verlo y descargar el PDF.', 'success');
    } catch (err) {
      this.showToast(err.message || 'No se pudo generar el certificado.', 'danger');
      button.disabled = false;
      button.textContent = 'Generar certificado';
    }
  }

  async eliminarInscripcion(id) {
    if (!confirm("¿Deseas eliminar este registro de inscripción?")) return;
    try {
      await window.StorageService.deleteInscripcion(id);
      this.showToast("Inscripción eliminada.", "success");
      await this.loadAllData();
    } catch (err) {
      console.error(err);
      this.showToast("Error al eliminar inscripción.", "danger");
    }
  }

  openInscripcionModal() {
    if (!this.inscripcionModal || !this.inscripcionForm) return;
    this.inscripcionForm.reset();
    const estadoSelect = document.getElementById("inscripcion-estado");
    if (estadoSelect) estadoSelect.value = "Inscripto";
    this.toggleFechaInscripcion();
    this.inscripcionModal.classList.add("active");
    document.body.style.overflow = "hidden";
    const firstInput = document.getElementById("inscripcion-nombre");
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }

  closeInscripcionModal() {
    if (!this.inscripcionModal) return;
    this.inscripcionModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  toggleFechaInscripcion() {
    const completed = document.getElementById('inscripcion-estado').value === 'completado';
    document.getElementById('inscripcion-fecha-grupo').hidden = !completed;
    const input = document.getElementById('inscripcion-fecha-finalizacion');
    input.required = completed;
    input.disabled = !completed;
    input.max = this.hoyInscripciones();
  }

  async handleSaveInscripcion(e) {
    e.preventDefault();
    const nombre = (document.getElementById("inscripcion-nombre")?.value || "").trim();
    const apellido = (document.getElementById("inscripcion-apellido")?.value || "").trim();
    const telefono = (document.getElementById("inscripcion-telefono")?.value || "").trim();
    const email = (document.getElementById("inscripcion-email")?.value || "").trim();
    const estado = document.getElementById("inscripcion-estado")?.value || "Inscripto";
    const fechaFinalizacion = document.getElementById('inscripcion-fecha-finalizacion');
    if (estado === 'completado' && (!fechaFinalizacion.value || !fechaFinalizacion.reportValidity())) {
      this.showToast('Seleccioná la fecha de finalización del curso.', 'warning');
      return;
    }

    if (!nombre || !telefono || !email) {
      this.showToast("Por favor completa los campos obligatorios (Nombre, Teléfono y Email).", "warning");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showToast("Por favor ingresa un correo electrónico válido.", "danger");
      return;
    }

    try {
      await window.StorageService.saveInscripcion({
        nombre,
        apellido,
        telefono,
        email,
        estado,
        fecha_finalizacion: estado === 'completado' ? fechaFinalizacion.value : null
      });

      const nombreMostrar = apellido ? `${nombre} ${apellido}` : nombre;
      this.showToast(`Inscripción de ${nombreMostrar} registrada con éxito.`, "success");
      this.closeInscripcionModal();
      await this.loadAllData();
    } catch (err) {
      console.error(err);
      this.showToast(err.message || "Error al registrar inscripción.", "danger");
    }
  }

  // ==========================================
  // 6. RESTABLECER DATOS DEMO
  // ==========================================
  handleResetDemo() {
    if (!confirm("¿Seguro que deseas restablecer todos los turnos, servicios e inscripciones a los valores iniciales de Marian Estilista?")) return;

    const ok = window.StorageService.resetToSeed();
    if (ok) {
      this.showToast("Datos iniciales restaurados con éxito.", "success");
      setTimeout(() => location.reload(), 800);
    }
  }

  showToast(msg, type = "info") {
    if (window.showToast) {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  }
}

// Inicializar al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  window.adminDashboard = new AdminDashboard();
});
