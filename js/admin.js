/**
 * admin.js - Lógica Interactiva del Panel de Administración de Marian Estilista
 */

class AdminDashboard {
  constructor() {
    this.currentTab = "dashboard";
    this.init();
  }

  async init() {
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
    this.sidebar = document.querySelector(".admin-sidebar");
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
    });

    // Toggle móvil sidebar
    if (this.mobileToggle && this.sidebar) {
      this.mobileToggle.addEventListener("click", () => {
        this.sidebar.classList.toggle("open");
      });
    }

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

    // Cerrar sidebar en móvil
    if (this.sidebar) {
      this.sidebar.classList.remove("open");
    }

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
    const stats = await window.StorageService.getDashboardStats();

    if (this.kpiTurnosHoy) this.kpiTurnosHoy.textContent = stats.turnosHoy;
    if (this.kpiTurnosPendientes) this.kpiTurnosPendientes.textContent = stats.turnosPendientes;
    if (this.kpiTurnosCompletados) this.kpiTurnosCompletados.textContent = stats.turnosCompletados;
    if (this.kpiTotalClientes) this.kpiTotalClientes.textContent = stats.totalClientes;
    if (this.kpiIngresosEstimados) this.kpiIngresosEstimados.textContent = `$${stats.ingresosEstimados.toLocaleString("es-AR")}`;
    if (this.kpiTotalInscripciones) this.kpiTotalInscripciones.textContent = stats.inscripcionesCurso;

    // Tabla rápida de turnos recientes en Dashboard
    if (this.dashboardRecentTurnosTable) {
      const turnos = await window.StorageService.getTurnos();
      const recientes = turnos.slice(0, 5);

      if (recientes.length === 0) {
        this.dashboardRecentTurnosTable.innerHTML = `<tr><td colspan="7" class="text-center">No hay turnos registrados aún.</td></tr>`;
        return;
      }

      this.dashboardRecentTurnosTable.innerHTML = recientes.map(t => `
        <tr>
          <td>
            <strong>${t.fecha}</strong><br>
            <span class="text-muted" style="font-size: 0.85rem;">${t.hora} hs</span>
          </td>
          <td>
            <strong>${t.cliente?.nombre || ''} ${t.cliente?.apellido || ''}</strong><br>
            <span class="text-muted" style="font-size: 0.82rem;">${t.cliente?.telefono || ''}</span>
          </td>
          <td>${t.servicioNombre}</td>
          <td><strong>Mariano</strong></td>
          <td><strong>$${Number(t.precio).toLocaleString("es-AR")}</strong></td>
          <td><span class="status-badge status-${t.estado.toLowerCase()}">${t.estado}</span></td>
          <td>
            <div class="action-buttons-group">
              ${t.estado === 'Pendiente' ? `<button class="btn-action btn-act-confirm" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Confirmado')" title="Confirmar">✓</button>` : ''}
              ${t.estado !== 'Completado' && t.estado !== 'Cancelado' ? `<button class="btn-action btn-act-complete" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Completado')" title="Marcar como Completado">★</button>` : ''}
              ${t.estado !== 'Cancelado' ? `<button class="btn-action btn-act-cancel" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Cancelado')" title="Cancelar">✕</button>` : ''}
            </div>
          </td>
        </tr>
      `).join("");
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

    const turnos = await window.StorageService.getTurnos(filtros);

    if (turnos.length === 0) {
      this.turnosTableBody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 30px;">No se encontraron turnos con los filtros seleccionados.</td></tr>`;
      return;
    }

    this.turnosTableBody.innerHTML = turnos.map(t => `
      <tr>
        <td><code>#${t.id.slice(-5)}</code></td>
        <td>
          <strong>${t.fecha}</strong><br>
          <span class="text-muted">${t.hora} hs (${t.duracionMinutos} min)</span>
        </td>
        <td>
          <strong>${t.cliente?.nombre || ''} ${t.cliente?.apellido || ''}</strong>
          ${t.cliente?.notas ? `<br><small class="text-muted" title="${t.cliente.notas}">📝 ${t.cliente.notas.slice(0, 24)}...</small>` : ''}
        </td>
        <td>
          <a href="tel:${t.cliente?.telefono}" class="contact-link">📱 ${t.cliente?.telefono}</a><br>
          <span class="text-muted" style="font-size: 0.8rem;">✉️ ${t.cliente?.email}</span>
        </td>
        <td><strong>${t.servicioNombre}</strong></td>
        <td>Mariano</td>
        <td><strong>$${Number(t.precio).toLocaleString("es-AR")}</strong></td>
        <td><span class="status-badge status-${t.estado.toLowerCase()}">${t.estado}</span></td>
        <td>
          <div class="action-buttons-group">
            ${t.estado === 'Pendiente' ? `
              <button class="btn btn-sm btn-action-pill btn-pill-confirm" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Confirmado')">
                Confirmar
              </button>
            ` : ''}
            ${t.estado === 'Confirmado' ? `
              <button class="btn btn-sm btn-action-pill btn-pill-complete" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Completado')">
                Completar
              </button>
            ` : ''}
            ${t.estado !== 'Cancelado' ? `
              <button class="btn btn-sm btn-action-pill btn-pill-cancel" onclick="window.adminDashboard.cambiarEstadoTurno('${t.id}', 'Cancelado')">
                Cancelar
              </button>
            ` : `
              <button class="btn btn-sm btn-action-pill btn-pill-delete" onclick="window.adminDashboard.eliminarTurno('${t.id}')">
                Eliminar
              </button>
            `}
          </div>
        </td>
      </tr>
    `).join("");
  }

  filterTurnosTable() {
    this.loadTurnosTable();
  }

  async cambiarEstadoTurno(id, nuevoEstado) {
    try {
      await window.StorageService.updateTurnoEstado(id, nuevoEstado);
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
      await window.StorageService.deleteTurno(id);
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

    const clientes = await window.StorageService.getClientes();

    if (clientes.length === 0) {
      this.clientesTableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 30px;">No hay clientas registradas aún.</td></tr>`;
      return;
    }

    this.clientesTableBody.innerHTML = clientes.map(c => `
      <tr>
        <td>
          <div class="client-avatar-cell">
            <div class="client-avatar-circle">${c.nombre.charAt(0)}${c.apellido.charAt(0)}</div>
            <div>
              <strong>${c.nombre} ${c.apellido}</strong>
            </div>
          </div>
        </td>
        <td><a href="tel:${c.telefono}">📱 ${c.telefono}</a></td>
        <td>✉️ ${c.email}</td>
        <td><span class="count-badge">${c.cantidadTurnos} ${c.cantidadTurnos === 1 ? 'turno' : 'turnos'}</span></td>
        <td>${c.ultimoTurno}</td>
        <td>
          ${c.cantidadTurnos >= 3 
            ? `<span class="badge-gold">👑 Clienta Frecuente</span>` 
            : `<span class="badge-regular">Cliente Estándar</span>`}
        </td>
      </tr>
    `).join("");
  }

  // ==========================================
  // 4. CRUD DE SERVICIOS
  // ==========================================
  async loadServicesGrid() {
    if (!this.serviciosGrid) return;

    const servicios = await window.StorageService.getServicios();

    this.serviciosGrid.innerHTML = servicios.map(s => `
      <div class="admin-srv-card ${!s.activo ? 'inactive' : ''}">
        <div class="admin-srv-img-wrap">
          <img src="${s.imagen}" alt="${s.nombre}" />
          <span class="admin-srv-badge">${s.categoria || 'Servicio'}</span>
          ${!s.activo ? `<span class="admin-srv-inactive-badge">Inactivo</span>` : ''}
        </div>
        <div class="admin-srv-body">
          <div class="admin-srv-top">
            <h4>${s.nombre}</h4>
            <span class="admin-srv-price">$${Number(s.precio).toLocaleString("es-AR")}</span>
          </div>
          <p class="admin-srv-desc">${s.descripcion}</p>
          <div class="admin-srv-meta">
            <span>⏱ ${s.duracionMinutos} min</span>
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
    `).join("");
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
      document.getElementById("crud-service-duracion").value = servicio.duracionMinutos;
      document.getElementById("crud-service-activo").value = servicio.activo ? "true" : "false";
      document.getElementById("crud-service-desc").value = servicio.descripcion;
      document.getElementById("crud-service-img").value = servicio.imagen;
    } else {
      titleElem.textContent = "Agregar Nuevo Servicio";
      idInput.value = "";
    }

    this.serviceModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  async openEditServiceModal(id) {
    const servicio = await window.StorageService.getServicioById(id);
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
    const duracionMinutos = Number(document.getElementById("crud-service-duracion").value);
    const activo = document.getElementById("crud-service-activo").value === "true";
    const descripcion = document.getElementById("crud-service-desc").value.trim();
    let imagen = document.getElementById("crud-service-img").value.trim();

    if (!imagen) {
      imagen = "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80";
    }

    const payload = { nombre, categoria, precio, duracionMinutos, activo, descripcion, imagen };

    try {
      if (id) {
        await window.StorageService.updateServicio(id, payload);
        this.showToast("Servicio actualizado correctamente.", "success");
      } else {
        await window.StorageService.saveServicio(payload);
        this.showToast("Nuevo servicio agregado con éxito.", "success");
      }

      this.closeServiceModal();
      await this.loadServicesGrid();
    } catch (err) {
      console.error(err);
      this.showToast("Error al guardar servicio.", "danger");
    }
  }

  async toggleServiceState(id, nuevoEstado) {
    try {
      await window.StorageService.updateServicio(id, { activo: nuevoEstado });
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
      const dateStr = new Date(ins.fecha).toLocaleDateString("es-AR", {
        day: "numeric", month: "short", year: "numeric"
      });

      return `
        <tr>
          <td><strong>${dateStr}</strong></td>
          <td><strong>${ins.nombre} ${ins.apellido || ''}</strong></td>
          <td><a href="tel:${ins.telefono}">📱 ${ins.telefono}</a></td>
          <td>✉️ ${ins.email}</td>
          <td>
            <span class="status-badge status-${ins.estado.toLowerCase()}">${ins.estado}</span>
          </td>
          <td>
            <div class="action-buttons-group">
              <select class="form-control form-control-sm" style="width: auto; display: inline-block;" onchange="window.adminDashboard.cambiarEstadoInscripcion('${ins.id}', this.value)">
                <option value="Pendiente" ${ins.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="Contactado" ${ins.estado === 'Contactado' ? 'selected' : ''}>Contactado</option>
                <option value="Inscripto" ${ins.estado === 'Inscripto' ? 'selected' : ''}>Inscripto</option>
              </select>
              <button class="btn btn-sm btn-action-pill btn-pill-delete" onclick="window.adminDashboard.eliminarInscripcion('${ins.id}')">
                Eliminar
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  async cambiarEstadoInscripcion(id, nuevoEstado) {
    try {
      await window.StorageService.updateInscripcionEstado(id, nuevoEstado);
      this.showToast(`Inscripción actualizada a "${nuevoEstado}".`, "success");
      await this.loadAllData();
    } catch (err) {
      console.error(err);
      this.showToast("Error al actualizar inscripción.", "danger");
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
