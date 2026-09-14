/**
 * main.js - Lógica Interactiva para la Landing Page de Marian Estilista
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Inicializar almacenamiento
  if (window.StorageService) {
    window.StorageService.init();
  }

  initNavbar();
  initHeroCarousel();
  initSalonMap();
  initGalleryFiltersAndLightbox();
  initCourseSection();
  initSmoothScroll();
});

/* --- CONFIGURACIÓN DE UBICACIÓN CENTRALIZADA --- */
const SALON_LOCATION = {
  lat: -41.133965,
  lng: -71.303469,
  name: "Marian Estilista",
  stylist: "Mariano Echavarría",
  address: "Calle General Nicolás Palacios 156 (Galería Paseo de la Catedral)",
  city: "San Carlos de Bariloche, Río Negro",
  schedule: "Martes a Sábados: 09:00 - 19:00 hs",
  scheduleClosed: "Domingos y Lunes: Cerrado",
  directionsUrl: "https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B-41.133965%2C-71.303469"
};

/* --- CARRUSEL HERO DE ALTA CALIDAD --- */
function initHeroCarousel() {
  const carousel = document.getElementById("hero-carousel");
  if (!carousel) return;

  const slides = carousel.querySelectorAll(".carousel-slide");
  const dots = carousel.querySelectorAll(".carousel-dot");
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");

  if (!slides.length) return;

  let currentIndex = 0;
  const totalSlides = slides.length;
  let autoplayTimer = null;
  const AUTOPLAY_INTERVAL = 5000;

  const goToSlide = (targetIndex) => {
    // Normalizar índice circular
    const newIndex = (targetIndex + totalSlides) % totalSlides;

    slides[currentIndex].classList.remove("active");
    slides[newIndex].classList.add("active");

    if (dots.length) {
      dots[currentIndex].classList.remove("active");
      dots[currentIndex].setAttribute("aria-selected", "false");
      dots[newIndex].classList.add("active");
      dots[newIndex].setAttribute("aria-selected", "true");
    }

    currentIndex = newIndex;
  };

  const nextSlide = () => goToSlide(currentIndex + 1);
  const prevSlide = () => goToSlide(currentIndex - 1);

  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, AUTOPLAY_INTERVAL);
  };

  const stopAutoplay = () => {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  // Botones de navegación
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevSlide();
      startAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextSlide();
      startAutoplay();
    });
  }

  // Indicadores / Dots
  dots.forEach((dot, idx) => {
    dot.addEventListener("click", () => {
      goToSlide(idx);
      startAutoplay();
    });
  });

  // Pausar al pasar el mouse por encima
  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);

  // Soporte táctil / Swipe para dispositivos móviles
  let touchStartX = 0;
  let touchStartY = 0;
  let isTouching = false;

  carousel.addEventListener("touchstart", (e) => {
    stopAutoplay();
    if (e.touches && e.touches.length) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isTouching = true;
    }
  }, { passive: true });

  carousel.addEventListener("touchend", (e) => {
    if (!isTouching || !e.changedTouches || !e.changedTouches.length) return;
    isTouching = false;

    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    // Verificar desplazamiento horizontal mínimo de 40px con predominio horizontal
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    startAutoplay();
  }, { passive: true });

  carousel.addEventListener("touchcancel", () => {
    isTouching = false;
    startAutoplay();
  }, { passive: true });

  // Iniciar autoplay
  startAutoplay();
}

/* --- MAPA INTERACTIVO (LEAFLET & OPENSTREETMAP) --- */
function initSalonMap() {
  const mapContainer = document.getElementById("salon-map");
  if (!mapContainer || typeof window.L === "undefined") return;

  try {
    const map = L.map("salon-map", {
      center: [SALON_LOCATION.lat, SALON_LOCATION.lng],
      zoom: 16,
      scrollWheelZoom: false, // Evita atrapar el scroll de página en móviles/desktop
      zoomControl: true
    });

    // Capa de mosaicos OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Pin de mapa personalizado en negro y dorado
    const customPin = L.divIcon({
      className: "custom-map-pin",
      html: `
        <div class="pin-marker-pulse"></div>
        <div class="pin-marker-core" title="${SALON_LOCATION.name}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 3a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3 3 3 0 0 0 2.22-.98l4.08 4.08a3 3 0 0 0-2.3 2.9 3 3 0 1 0 3-3 2.98 2.98 0 0 0-.9-2.22l4.08-4.08A3 3 0 0 0 21 8V6a3 3 0 0 0-3-3 3 3 0 0 0-2.82 2H9.82A3 3 0 0 0 6 3z"/>
          </svg>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 38],
      popupAnchor: [0, -38]
    });

    // Contenido del popup personalizado
    const popupHtml = `
      <div class="salon-popup-card">
        <h4>${SALON_LOCATION.name}</h4>
        <div class="popup-address">
          📍 <strong>${SALON_LOCATION.address}</strong><br>
          <span style="color: #bbb;">${SALON_LOCATION.city}</span>
        </div>
        <div class="popup-schedule">
          🕒 <strong>Horario:</strong> ${SALON_LOCATION.schedule}<br>
          <span style="color: #999;">${SALON_LOCATION.scheduleClosed}</span>
        </div>
        <a href="${SALON_LOCATION.directionsUrl}" target="_blank" rel="noopener noreferrer" class="btn-map-directions">
          Cómo llegar →
        </a>
      </div>
    `;

    const marker = L.marker([SALON_LOCATION.lat, SALON_LOCATION.lng], { icon: customPin }).addTo(map);
    marker.bindPopup(popupHtml);

    // Abrir popup tras renderizado para mostrar información
    setTimeout(() => {
      marker.openPopup();
    }, 700);
  } catch (err) {
    console.error("Error al inicializar Leaflet Map:", err);
  }
}

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

  // Normalizador de texto para tolerar acentos y mayúsculas
  const normalize = (str) => (str || "").toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Filtros por categoría
  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        filterBtns.forEach(b => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        const filterRaw = btn.getAttribute("data-filter") || "";
        const filterValue = normalize(filterRaw);

        galleryItems.forEach(item => {
          const itemCategoryRaw = item.getAttribute("data-category") || "";
          const itemCategory = normalize(itemCategoryRaw);

          const isAll = filterValue === "all" || filterValue === "todos" || filterValue === "";
          const isMatch = isAll || itemCategory === filterValue || itemCategory.includes(filterValue);

          if (isMatch) {
            item.classList.remove("gallery-item--hidden");
            item.style.display = "";
            item.style.animation = "fadeInStep 0.35s ease forwards";
          } else {
            item.classList.add("gallery-item--hidden");
            item.style.display = "none";
          }
        });
      });
    });
  }

  // Lightbox al hacer clic en un item visible de la galería
  galleryItems.forEach(item => {
    item.addEventListener("click", () => {
      if (item.classList.contains("gallery-item--hidden") || item.style.display === "none") {
        return;
      }
      const img = item.querySelector("img");
      const title = item.querySelector("h4, .gallery-title");
      const desc = item.querySelector("p, .gallery-desc");
      const tag = item.querySelector(".gallery-tag, .gallery-category");

      if (lightbox && lightboxImg && img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || "Trabajo Marian Estilista";
        if (lightboxTitle) lightboxTitle.textContent = title ? title.textContent : "";
        if (lightboxDesc) lightboxDesc.textContent = desc ? desc.textContent : "";
        if (lightboxTag) lightboxTag.textContent = tag ? tag.textContent : "";

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

      const nombre = document.getElementById("ins-nombre")?.value.trim() || "";
      const apellido = document.getElementById("ins-apellido")?.value.trim() || "";
      const telefono = document.getElementById("ins-telefono")?.value.trim() || "";
      const email = document.getElementById("ins-email")?.value.trim() || "";

      // El formulario usa ins-nombre para nombre completo; apellido es opcional
      const nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;

      if (!nombreCompleto || !telefono || !email) {
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
          nombre: nombreCompleto,
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

