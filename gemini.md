# PROYECTO: PORTAL WEB PARA MARIAN ESTILISTA

## 1. INFORMACIÓN DEL NEGOCIO
- **Nombre:** Marian Estilista
- **Profesional Principal:** Mariano (Único profesional del salón).
- **Enfoque Exclusivo:** Peluquería, coloración, tratamientos capilares, alisados y peinados para **mujeres**.
- **Ubicación:** Galería La Catedral, San Carlos de Bariloche – Salón Marian Estilista.
- **Experiencia:** +15 Años de Experiencia.
- **Especialización:** Coloración, Técnicas de Iluminación (Balayage, Babylights), Tratamientos Capilares, Alisados y Peinados.
- **Reglas Estrictas de Negocio:**
  - Salón 100% orientado a peluquería y belleza femenina.
  - NO incluir barbería ni corte masculino ni servicios de barba.
  - NO inventar múltiples profesionales ficticios (Mariano es el único estilista).
  - NO inventar testimonios ficticios ni certificaciones/premios no provistos.
  - Ubicación oficial: Galería La Catedral, San Carlos de Bariloche.

---

## 2. SERVICIOS PRINCIPALES (CATÁLOGO OFICIAL)
1. **Mechas Babylight:** Técnica de iluminación sutil que aporta luminosidad y dimensión al cabello mediante reflejos delicados y naturales.
2. **Balayage:** Técnica de coloración que crea una iluminación progresiva y natural, adaptada a cada cabello.
3. **Tratamiento de Keratina:** Tratamiento destinado a mejorar la apariencia, suavidad y manejabilidad del cabello.
4. **Alisado 5D:** Servicio de alisado profesional avanzado.
5. **Alisado 6D Laser:** Servicio de alisado profesional de alta precisión y brillo.
6. **Peinados:** Peinados profesionales para eventos, ocasiones especiales y diferentes estilos.
7. **Coloración:** Coloración y trabajos de color personalizados según el cabello y objetivo de cada clienta.

---

## 3. CURSO DE PELUQUERÍA PROFESIONAL
- **Título:** ✨ ¡INSCRIPCIONES ABIERTAS! CURSO COMPLETO DE PELUQUERÍA PROFESIONAL
- **Inicio:** 10 de julio.
- **Lugar:** Galería La Catedral, San Carlos de Bariloche – Salón Marian Estilista.
- **Modalidad:** Presencial. Curso completo y 100% práctico.
- **Duración:** 5 meses.
- **Frecuencia:** 1 vez por semana.
- **Formación:** Teoría y práctica profesional.
- **Inversión:** $350.000 por mes.
- **Certificación:** Al finalizar el curso se entregará un certificado.
- **Contenidos:**
  - **Color y colorimetría:** Colorimetría completa, tinturas y formulación del color, retoque de raíces, cubrimiento de canas, corrección de color, decoloración profesional, matización (beige, manteca, ceniza, perlado y más).
  - **Técnicas de iluminación:** Balayage, Babylights, mechas y reflejos.
  - **Alisados y tratamientos:** Alisados, Botox capilar, shock de keratina, tratamientos de hidratación, nutrición y reconstrucción.
  - **Diagnóstico y atención profesional:** Diagnóstico capilar, atención al cliente y asesoramiento profesional.
- **Inscripción:** Botón "Quiero inscribirme" que abre modal/formulario (Nombre, Apellido, Teléfono, Email) y persiste en `localStorage`.

---

## 4. SISTEMA DE RESERVA DE TURNOS (6 PASOS)
Como Marian Estilista tiene un único profesional (**Mariano**), NO existe paso para seleccionar profesional.
- **Paso 1 — Seleccionar Servicio:** Listado de los 7 servicios disponibles con precio, duración y detalles.
- **Paso 2 — Seleccionar Fecha:** Calendario interactivo (mes actual y siguientes, sin fechas pasadas, días habilitados).
- **Paso 3 — Horarios Disponibles:** Franjas horarias con detección de disponibilidad.
- **Paso 4 — Datos del Cliente:** Nombre, Apellido, Teléfono, Email (con validaciones).
- **Paso 5 — Resumen del Turno:** Resumen completo con Profesional: Mariano y botón "Confirmar turno".
- **Paso 6 — Confirmación:** Mensaje de éxito, resumen final y botón "Volver al inicio". Almacenamiento en `localStorage`.

---

## 5. PANEL DE ADMINISTRACIÓN
Acceso directo en `/pages/admin.html` (sin login en esta versión frontend).
- **Dashboard:** Métricas clave (Turnos de hoy, Turnos pendientes, Turnos completados, Clientes registrados, Ingresos estimados, Inscripciones al curso).
- **Turnos:** Tabla con filtros y acciones de estado (Confirmar, Cancelar, Marcar como completado).
- **Clientes:** Directorio generado automáticamente de las reservas.
- **Servicios:** CRUD interactivo de servicios.
- **Curso e Inscripciones:** Visualización y gestión de estados de postulantes (Pendiente, Contactado, Inscripto).
- **Configuración:** Configuración general del salón y restablecimiento de datos demo.

---

## 6. TECNOLOGÍAS Y ARQUITECTURA
- **Frontend Core:** HTML5 Semántico, CSS3 Vanilla, JavaScript Vanilla (ES6+).
- **Sin Dependencias Pesadas:** Sin React/Vue/Angular, sin Bootstrap, sin Tailwind.
- **Persistencia Temporal:** `localStorage` mediante módulo centralizado `storage.js`.
- **Preparación para Backend:** Estructura de entidades con IDs y DTOs lista para migrar a Java + Spring Boot + PostgreSQL.
- **Estética Visual:** Diseño premium, femenino, sofisticado, tipografía elegante (Playfair Display + Plus Jakarta Sans), paleta Champagne Gold / Rose Nude / Noir Luxury, microinteracciones suaves y responsive design.
