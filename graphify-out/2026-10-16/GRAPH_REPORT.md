# Graph Report - peluqueria-portal  (2026-10-16)

## Corpus Check
- 106 files · ~894,989 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 21 file(s) not represented in the graph (top: (none) 13, .css 7, .example 1)

## Summary
- 813 nodes · 1442 edges · 74 communities (16 shown, 58 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 157 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `40aea58d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PHPMailer
- jsonResponse
- gemini.md
- MailerService
- SMTP
- api.js
- FPDF
- AdminDashboard
- StorageService
- BookingWizard
- Exception
- InscripcionRepository
- Certificado
- Marian Estilista — Documentación Técnica del Backend (PHP + MySQL)
- certificados_frontend.mjs
- ReservaRepository
- UsuarioRepository
- composer.json
- ProfesionalRepository
- main.js
- Certificados de cursos
- Usuario
- alerts.js
- Database
- auth.js
- certificados_integration.php
- .setOAuth
- AGENTS.md
- data.js

## God Nodes (most connected - your core abstractions)
1. `PHPMailer` - 132 edges
2. `FPDF` - 93 edges
3. `SMTP` - 47 edges
4. `Exception` - 43 edges
5. `AdminDashboard` - 35 edges
6. `jsonResponse()` - 32 edges
7. `requestApi()` - 26 edges
8. `StorageService` - 26 edges
9. `BookingWizard` - 24 edges
10. `UsuarioRepository` - 22 edges

## Surprising Connections (you probably didn't know these)
- `2. Descripción de las Capas Backend` --references--> `getRequestData()`  [INFERRED]
  backend/README.md → backend/config/helpers.php
- `2. Descripción de las Capas Backend` --references--> `Profesional`  [INFERRED]
  backend/README.md → backend/models/Profesional.php
- `2. Descripción de las Capas Backend` --references--> `Reserva`  [INFERRED]
  backend/README.md → backend/models/Reserva.php
- `2. Descripción de las Capas Backend` --references--> `Servicio`  [INFERRED]
  backend/README.md → backend/models/Servicio.php
- `2. Descripción de las Capas Backend` --references--> `Usuario`  [INFERRED]
  backend/README.md → backend/models/Usuario.php

## Import Cycles
- None detected.

## Communities (74 total, 58 thin omitted)

### Community 1 - "jsonResponse"
Cohesion: 0.07
Nodes (13): setupCors(), getAuthUser(), getRequestData(), jsonResponse(), requireAdmin(), requireAuth(), AuthController, CertificadoController (+5 more)

### Community 2 - "gemini.md"
Cohesion: 0.04
Nodes (46): 10. RESPONSIVE DESIGN — EXTREMELY IMPORTANT, 11. BREAKPOINT & LAYOUT GUIDELINES, 12. ACCESSIBILITY & UX, 13. MICROINTERACTIONS & ANIMATION, 14. CODE QUALITY REQUIREMENTS, 15. DESIGN CONSISTENCY, 16. IMPORTANT IMPLEMENTATION PRINCIPLES, 1. BUSINESS INFORMATION (+38 more)

### Community 3 - "MailerService"
Cohesion: 0.07
Nodes (8): normalizarTelefono(), validarEmail(), validarNombre(), validarTelefono(), AuthException, AuthService, MailerService, PdfTicketService

### Community 5 - "api.js"
Cohesion: 0.09
Nodes (29): API_BASE, apiActualizarEstadoReserva(), apiCancelarReserva(), apiCrearReserva(), apiCreateInscripcion(), apiCreateServicio(), apiDeleteInscripcion(), apiDeleteServicio() (+21 more)

### Community 10 - "Exception"
Cohesion: 0.06
Nodes (8): Exception, Servicio, PDO, ServicioRepository, InscripcionService, ProfesionalService, ReservaService, ServicioService

### Community 12 - "InscripcionRepository"
Cohesion: 0.23
Nodes (3): Inscripcion, InscripcionRepository, PDO

### Community 13 - "Certificado"
Cohesion: 0.13
Nodes (5): Certificado, CertificadoRepository, PDO, CertificadoPdfService, CertificadoService

### Community 14 - "Marian Estilista — Documentación Técnica del Backend (PHP + MySQL)"
Cohesion: 0.11
Nodes (18): 1. Estructura del Proyecto, 3. Base de Datos MySQL (`marian_estilista`), 4. Guía de Instalación y Configuración Local, 5. Cuentas de Prueba Preconfiguradas (Desarrollo), 6. Catálogo de la API REST, 7. Flujo de Trabajo de las Reservas, Autenticación (`/api/auth/`), Catálogo de Servicios (`/api/servicios/`) (+10 more)

### Community 15 - "certificados_frontend.mjs"
Cohesion: 0.17
Nodes (9): context, dashboard, dateForm, row, select, toasts, ref_node_assert, ref_node_fs (+1 more)

### Community 17 - "ReservaRepository"
Cohesion: 0.13
Nodes (3): Reserva, PDO, ReservaRepository

### Community 21 - "composer.json"
Cohesion: 0.17
Nodes (11): autoload, psr-4, description, name, PHPMailer\\PHPMailer\\, require, bacon/bacon-qr-code, php (+3 more)

### Community 22 - "ProfesionalRepository"
Cohesion: 0.20
Nodes (3): Profesional, PDO, ProfesionalRepository

### Community 23 - "main.js"
Cohesion: 0.20
Nodes (3): initCourseSection(), SALON_LOCATION, showToast()

### Community 24 - "Certificados de cursos"
Cohesion: 0.25
Nodes (7): Actualización de una instalación existente, Archivos, Certificados de cursos, Comportamiento, Endpoints, Fecha de finalización elegida por el administrador, Pruebas

### Community 26 - "alerts.js"
Cohesion: 0.36
Nodes (4): closeModal(), ensureModalDom(), showAlertModal(), showConfirmModal()

### Community 28 - "auth.js"
Cohesion: 0.42
Nodes (9): getAuthReturnTarget(), initLoginPage(), initMisReservasPage(), initRegisterPage(), initResetPasswordPage(), prepareCourseAuthFlow(), _reenviarVerificacionDesdeLogin(), setupPasswordToggle() (+1 more)

## Knowledge Gaps
- **74 isolated node(s):** `name`, `description`, `type`, `php`, `phpmailer/phpmailer` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 312 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **58 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Exception` connect `Exception` to `MailerService`, `SMTP`, `.setError`, `.preSend`, `.DKIM_Add`, `.createBody`, `Database`, `.addOrEnqueueAnAddress`, `.smtpConnect`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `FPDF` connect `FPDF` to `jsonResponse`, `MailerService`, `Exception`, `Certificado`, `.preSend`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `PHPMailer` connect `PHPMailer` to `.setOAuth`, `.msgHTML`, `MailerService`, `SMTP`, `Exception`, `.setError`, `.preSend`, `.DKIM_Add`, `.createBody`, `.addOrEnqueueAnAddress`, `.smtpConnect`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `FPDF` (e.g. with `.generar()` and `.generarTicketPdf()`) actually correct?**
  _`FPDF` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 37 inferred relationships involving `Exception` (e.g. with `.getConnection()` and `.Error()`) actually correct?**
  _`Exception` has 37 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `description`, `type` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PHPMailer` be split into smaller, more focused modules?**
  _Cohesion score 0.0385739333722969 - nodes in this community are weakly interconnected._