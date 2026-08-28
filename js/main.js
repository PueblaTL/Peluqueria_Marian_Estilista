/**
 * main.js - Lógica Interactiva para la Landing Page de Marian Estilista
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Inicializar almacenamiento
  if (window.StorageService) {
    window.StorageService.init();
  }

  initNavbar();
  initGalleryFiltersAndLightbox();
  initCourseSection();
  initSmoothScroll();
});

/* --- NAVBAR & SCROLL INTERACTION --- */
function initNavbar() {
  const header = document.getElementById("site-header");
  const mobileToggle = document.getElementById("mobile-toggle");
  const mainNav = document.getElementById("main-nav");
  const navLinks = document.querySelectorAll(".nav-link");

  // Sticky header background
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    // Active link on scroll
    const sections = document.querySelectorAll("section[id]");
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute("id");
      const link = document.querySelector(`.main-nav a[href*='${sectionId}']`);

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(l => l.classList.remove("active"));
        if (link) link.classList.add("active");
      }
    });
  });

  // Mobile menu toggle
  if (mobileToggle && mainNav) {

    mobileToggle.addEventListener("click", () => {

      mainNav.classList.toggle("active");

      const isExpanded = mainNav.classList.contains("active");

      mobileToggle.setAttribute(
        "aria-expanded",
        isExpanded ? "true" : "false"
      );

      mobileToggle.setAttribute(
        "aria-label",
        isExpanded
          ? "Cerrar menú de navegación"
          : "Abrir menú de navegación"
      );
    });


    // Close menu when clicking link
    navLinks.forEach(link => {

      link.addEventListener("click", () => {

        mainNav.classList.remove("active");

        mobileToggle.setAttribute(
          "aria-expanded",
          "false"
        );

        mobileToggle.setAttribute(
          "aria-label",
          "Abrir menú de navegación"
        );

      });

    });
  }

  /* --- FILTROS DE GALERÍA Y LIGHTBOX MODAL --- */
  function initGalleryFiltersAndLightbox() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    const galleryItems = document.querySelectorAll(".gallery-item");
    const lightbox = document.getElementById("modal-gallery-lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxTitle = document.getElementById("lightbox-title");
    const lightboxDesc = document.getElementById("lightbox-desc");
    const lightboxTag = document.getElementById("lightbox-tag");
    const closeLightboxBtn = document.getElementById("btn-close-lightbox");

    // Filtros por categoría
    if (filterBtns.length && galleryItems.length) {
      filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          filterBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");

          const filterValue = btn.getAttribute("data-filter");

          galleryItems.forEach(item => {
            const itemCategory = item.getAttribute("data-category");
            if (filterValue === "all" || itemCategory === filterValue) {
              item.style.display = "block";
              item.style.animation = "fadeInStep 0.35s ease";
            } else {
              item.style.display = "none";
            }
          });
        });
      });
    }

    // Lightbox al hacer clic en un item de la galería
    galleryItems.forEach(item => {
      item.addEventListener("click", () => {
        const img = item.querySelector("img");
        const title = item.querySelector("h4");
        const desc = item.querySelector("p");
        const tag = item.querySelector(".gallery-tag");

        if (lightbox && lightboxImg) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt;
          if (lightboxTitle && title) lightboxTitle.textContent = title.textContent;
          if (lightboxDesc && desc) lightboxDesc.textContent = desc.textContent;
          if (lightboxTag && tag) lightboxTag.textContent = tag.textContent;

          lightbox.classList.add("active");
          lightbox.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
        }
      });
    });

    // Cerrar Lightbox
    const closeLightbox = () => {
      if (lightbox) {
        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }
    };

    if (closeLightboxBtn) {
      closeLightboxBtn.addEventListener("click", closeLightbox);
    }

    if (lightbox) {
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
          closeLightbox();
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox && lightbox.classList.contains("active")) {
        closeLightbox();
      }
    });
  }

  /* --- SECCIÓN DE CURSO & MODAL DE INSCRIPCIÓN --- */
  function initCourseSection() {
    const enrollBtn = document.getElementById("btn-inscribirme-curso");
    const modal = document.getElementById("modal-inscripcion-curso");
    const closeBtn = document.getElementById("btn-close-curso-modal");
    const cancelBtn = document.getElementById("btn-cancel-inscripcion");
    const form = document.getElementById("form-inscripcion-curso");

    const openModal = () => {
      if (modal) {
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }
    };

    const closeModal = () => {
      if (modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }
    };

    if (enrollBtn) {
      enrollBtn.addEventListener("click", openModal);
    }

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && modal.classList.contains("active")) {
        closeModal();
      }
    });

    // Envío del formulario de inscripción
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("ins-nombre").value.trim();
        const apellido = document.getElementById("ins-apellido").value.trim();
        const telefono = document.getElementById("ins-telefono").value.trim();
        const email = document.getElementById("ins-email").value.trim();

        if (!nombre || !apellido || !telefono || !email) {
          showToast("Por favor completa todos los campos requeridos.", "warning");
          return;
        }

        // Validar formato de email básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showToast("Por favor ingresa un correo electrónico válido.", "danger");
          return;
        }

        const submitBtn = document.getElementById("btn-submit-inscripcion");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Registrando inscripción...";
        }

        try {
          await window.StorageService.saveInscripcion({
            nombre,
            apellido,
            telefono,
            email
          });

          showToast("✨ ¡Inscripción registrada con éxito! Te contactaremos a la brevedad.", "success");
          form.reset();
          closeModal();
        } catch (err) {
          console.error("Error al registrar inscripción:", err);
          showToast("Ocurrió un error al registrar la inscripción. Inténtalo nuevamente.", "danger");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Confirmar Inscripción";
          }
        }
      });
    }
  }

  /* --- SCROLL SUAVE --- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (href === "#") return;

        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      });
    });
  }

  /* --- UTILIDAD TOAST NOTIFICATION --- */
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;

    let iconSvg = "ℹ️";
    if (type === "success") iconSvg = "✓";
    if (type === "warning") iconSvg = "⚠️";
    if (type === "danger") iconSvg = "✕";

    toast.innerHTML = `
    <span class="toast-icon">${iconSvg}</span>
    <span class="toast-msg">${message}</span>
  `;

    container.appendChild(toast);

    // Animación de entrada
    setTimeout(() => toast.classList.add("show"), 10);

    // Auto remover
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Exportar globalmente para otros scripts si es necesario
  if (typeof window !== "undefined") {
    window.showToast = showToast;
  }
}
