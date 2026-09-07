/**
 * main.js - Lógica Interactiva para la Landing Page de Aura Studio
 * Portal Web Profesional - Presentación Universitaria
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Inicializar almacenamiento si está disponible
  if (window.StorageService) {
    window.StorageService.init();
  }

  initNavbar();
  initHeroCarousel();
  initGalleryFiltersAndLightbox();
  initCourseSection();
  initInteractiveMap();
  initContactForm();
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

      mobileToggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      mobileToggle.setAttribute(
        "aria-label",
        isExpanded ? "Cerrar menú de navegación" : "Abrir menú de navegación"
      );
    });

    // Close menu when clicking link
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("active");
        mobileToggle.setAttribute("aria-expanded", "false");
        mobileToggle.setAttribute("aria-label", "Abrir menú de navegación");
      });
    });
  }
}

/* --- CARRUSEL INTERACTIVO (INICIO) --- */
function initHeroCarousel() {
  const container = document.getElementById("hero-carousel-container");
  if (!container) return;

  const slides = container.querySelectorAll(".carousel-slide");
  const prevBtn = document.getElementById("carousel-btn-prev");
  const nextBtn = document.getElementById("carousel-btn-next");
  const dots = container.querySelectorAll(".carousel-dot");

  if (!slides.length) return;

  let currentIndex = 0;
  let autoplayInterval = null;
  const slideDelay = 5000; // 5 segundos por diapositiva

  const showSlide = (index) => {
    // Normalizar índice
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;
    currentIndex = index;

    slides.forEach((slide, i) => {
      if (i === currentIndex) {
        slide.classList.add("active");
      } else {
        slide.classList.remove("active");
      }
    });

    dots.forEach((dot, i) => {
      if (i === currentIndex) {
        dot.classList.add("active");
        dot.setAttribute("aria-current", "true");
      } else {
        dot.classList.remove("active");
        dot.removeAttribute("aria-current");
      }
    });
  };

  const nextSlide = () => showSlide(currentIndex + 1);
  const prevSlide = () => showSlide(currentIndex - 1);

  // Event listeners para botones
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      nextSlide();
      restartAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      prevSlide();
      restartAutoplay();
    });
  }

  // Event listeners para puntos (dots)
  dots.forEach((dot) => {
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      const targetIdx = parseInt(dot.getAttribute("data-index"), 10);
      if (!isNaN(targetIdx)) {
        showSlide(targetIdx);
        restartAutoplay();
      }
    });
  });

  // Autoplay temporizado
  const startAutoplay = () => {
    if (!autoplayInterval) {
      autoplayInterval = setInterval(nextSlide, slideDelay);
    }
  };

  const stopAutoplay = () => {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  };

  const restartAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  // Pausar al posar el cursor o interactuar
  container.addEventListener("mouseenter", stopAutoplay);
  container.addEventListener("mouseleave", startAutoplay);
  container.addEventListener("focusin", stopAutoplay);
  container.addEventListener("focusout", startAutoplay);

  // Soporte para gestos táctiles (Swipe)
  let touchStartX = 0;
  let touchEndX = 0;

  container.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoplay();
    },
    { passive: true }
  );

  container.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      startAutoplay();
    },
    { passive: true }
  );

  const handleSwipe = () => {
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 45) {
      if (diff < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  // Iniciar autoplay
  startAutoplay();
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

  const normalize = (str) =>
    (str || "")
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // Filtros por categoría
  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        const filterRaw = btn.getAttribute("data-filter") || "";
        const filterValue = normalize(filterRaw);

        galleryItems.forEach((item) => {
          const itemCategoryRaw = item.getAttribute("data-category") || "";
          const itemCategory = normalize(itemCategoryRaw);

          const isAll =
            filterValue === "all" || filterValue === "todos" || filterValue === "";
          const isMatch =
            isAll || itemCategory === filterValue || itemCategory.includes(filterValue);

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

  // Lightbox al hacer clic en un item visible
  galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (
        item.classList.contains("gallery-item--hidden") ||
        item.style.display === "none"
      ) {
        return;
      }
      const img = item.querySelector("img");
      const title = item.querySelector("h4, .gallery-title");
      const desc = item.querySelector("p, .gallery-desc");
      const tag = item.querySelector(".gallery-tag, .gallery-category");

      if (lightbox && lightboxImg && img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || "Trabajo Aura Studio";
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

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("ins-nombre")?.value.trim() || "";
      const telefono = document.getElementById("ins-telefono")?.value.trim() || "";
      const email = document.getElementById("ins-email")?.value.trim() || "";

      if (!nombre || !telefono || !email) {
        showToast("Por favor completa todos los campos requeridos.", "warning");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast("Por favor ingresa un correo electrónico válido.", "danger");
        return;
      }

      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Registrando inscripción...";
      }

      try {
        if (window.StorageService) {
          await window.StorageService.saveInscripcion({
            nombre,
            telefono,
            email
          });
        }

        showToast(
          "✨ ¡Inscripción registrada con éxito! Te contactaremos a la brevedad.",
          "success"
        );
        form.reset();
        closeModal();
      } catch (err) {
        console.error("Error al registrar inscripción:", err);
        showToast("Ocurrió un error. Inténtalo nuevamente.", "danger");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Confirmar Inscripción";
        }
      }
    });
  }
}

/* --- MAPA INTERACTIVO (LEAFLET EN CONTACTO) --- */
function initInteractiveMap() {
  const mapElement = document.getElementById("interactive-map");
  if (!mapElement || typeof L === "undefined") return;

  // Coordenadas del salón (Av. San Martín 450)
  const coords = window.SEED_DATA?.negocio?.coordenadas || [-34.603722, -58.381592];

  // Crear mapa con Leaflet
  const map = L.map("interactive-map", {
    center: coords,
    zoom: 16,
    scrollWheelZoom: false // Evitar zoom accidental mientras se hace scroll
  });

  // Capa de mosaicos OpenStreetMap
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Marcador personalizado dorado con pulso
  const customIcon = L.divIcon({
    className: "custom-leaflet-marker-wrapper",
    html: `
      <div class="custom-leaflet-marker">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42]
  });

  // Popup estilizado
  const popupContent = `
    <div class="map-popup-inner">
      <div class="map-popup-title">Aura Studio</div>
      <div class="map-popup-subtitle">Peluquería & Estilismo Integral</div>
      <div class="map-popup-address">
        📍 Av. San Martín 450, Galería Comercial<br>
        Piso 1, Local 14
      </div>
      <a href="https://www.openstreetmap.org/?mlat=${coords[0]}&mlon=${coords[1]}#map=16/${coords[0]}/${coords[1]}" target="_blank" class="map-popup-link">
        Ver en pantalla completa ↗
      </a>
    </div>
  `;

  const marker = L.marker(coords, { icon: customIcon }).addTo(map);
  marker.bindPopup(popupContent);

  // Abrir popup automáticamente tras 1 segundo para destacar
  setTimeout(() => {
    marker.openPopup();
  }, 1000);
}

/* --- FORMULARIO DE CONTACTO RÁPIDO --- */
function initContactForm() {
  const form = document.getElementById("fast-contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("ct-nombre")?.value.trim() || "";
    const email = document.getElementById("ct-email")?.value.trim() || "";
    const mensaje = document.getElementById("ct-mensaje")?.value.trim() || "";

    if (!nombre || !email || !mensaje) {
      showToast("Por favor completa todos los campos del mensaje.", "warning");
      return;
    }

    const btn = form.querySelector("button[type='submit']");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Enviando mensaje...";
    }

    setTimeout(() => {
      showToast("✨ ¡Mensaje enviado! Te responderemos muy pronto.", "success");
      form.reset();
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Enviar mensaje";
      }
    }, 600);
  });
}

/* --- SCROLL SUAVE --- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
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

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

if (typeof window !== "undefined") {
  window.showToast = showToast;
}
