# Graph Report - peluqueria-portal  (2026-09-20)

## Corpus Check
- 89 files · ~562,485 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 5, (none) 2, .example 1)

## Summary
- 746 nodes · 1353 edges · 68 communities (13 shown, 55 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 147 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `98b6d15d`
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
- Servicio
- Exception
- InscripcionRepository
- Marian Estilista — Documentación Técnica del Backend (PHP + MySQL)
- ReservaRepository
- UsuarioRepository
- composer.json
- ProfesionalRepository
- main.js
- .AddPage
- Usuario
- alerts.js
- Database
- auth.js
- ProfesionalService
- AGENTS.md
- data.js

## God Nodes (most connected - your core abstractions)
1. `PHPMailer` - 132 edges
2. `FPDF` - 92 edges
3. `SMTP` - 47 edges
4. `Exception` - 43 edges
5. `jsonResponse()` - 31 edges
6. `AdminDashboard` - 31 edges
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

## Communities (68 total, 55 thin omitted)

### Community 1 - "jsonResponse"
Cohesion: 0.08
Nodes (11): getAuthUser(), getRequestData(), jsonResponse(), requireAdmin(), requireAuth(), AuthController, InscripcionController, ProfesionalController (+3 more)

### Community 2 - "gemini.md"
Cohesion: 0.04
Nodes (46): 10. RESPONSIVE DESIGN — EXTREMELY IMPORTANT, 11. BREAKPOINT & LAYOUT GUIDELINES, 12. ACCESSIBILITY & UX, 13. MICROINTERACTIONS & ANIMATION, 14. CODE QUALITY REQUIREMENTS, 15. DESIGN CONSISTENCY, 16. IMPORTANT IMPLEMENTATION PRINCIPLES, 1. BUSINESS INFORMATION (+38 more)

### Community 3 - "MailerService"
Cohesion: 0.06
Nodes (9): normalizarTelefono(), validarEmail(), validarNombre(), validarTelefono(), AuthException, AuthService, MailerService, PdfTicketService (+1 more)

### Community 5 - "api.js"
Cohesion: 0.09
Nodes (29): API_BASE, apiActualizarEstadoReserva(), apiCancelarReserva(), apiCrearReserva(), apiCreateInscripcion(), apiCreateServicio(), apiDeleteInscripcion(), apiDeleteServicio() (+21 more)

### Community 10 - "Servicio"
Cohesion: 0.11
Nodes (4): Servicio, PDO, ServicioRepository, ServicioService

### Community 12 - "InscripcionRepository"
Cohesion: 0.13
Nodes (4): Inscripcion, InscripcionRepository, PDO, InscripcionService

### Community 14 - "Marian Estilista — Documentación Técnica del Backend (PHP + MySQL)"
Cohesion: 0.11
Nodes (18): 1. Estructura del Proyecto, 3. Base de Datos MySQL (`marian_estilista`), 4. Guía de Instalación y Configuración Local, 5. Cuentas de Prueba Preconfiguradas (Desarrollo), 6. Catálogo de la API REST, 7. Flujo de Trabajo de las Reservas, Autenticación (`/api/auth/`), Catálogo de Servicios (`/api/servicios/`) (+10 more)

### Community 17 - "ReservaRepository"
Cohesion: 0.13
Nodes (3): Reserva, PDO, ReservaRepository

### Community 21 - "composer.json"
Cohesion: 0.18
Nodes (10): autoload, psr-4, description, name, PHPMailer\\PHPMailer\\, require, php, phpmailer/phpmailer (+2 more)

### Community 22 - "ProfesionalRepository"
Cohesion: 0.20
Nodes (3): Profesional, PDO, ProfesionalRepository

### Community 23 - "main.js"
Cohesion: 0.22
Nodes (3): initCourseSection(), SALON_LOCATION, showToast()

### Community 26 - "alerts.js"
Cohesion: 0.36
Nodes (4): closeModal(), ensureModalDom(), showAlertModal(), showConfirmModal()

### Community 28 - "auth.js"
Cohesion: 0.39
Nodes (6): initLoginPage(), initMisReservasPage(), initRegisterPage(), initResetPasswordPage(), _reenviarVerificacionDesdeLogin(), setupPasswordToggle()

## Knowledge Gaps
- **61 isolated node(s):** `name`, `description`, `type`, `php`, `phpmailer/phpmailer` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 278 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Exception` connect `Exception` to `MailerService`, `SMTP`, `Servicio`, `InscripcionRepository`, `.preSend`, `.DKIM_Add`, `.createBody`, `Database`, `.addOrEnqueueAnAddress`, `ProfesionalService`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `PHPMailer` connect `PHPMailer` to `.msgHTML`, `MailerService`, `SMTP`, `Exception`, `.preSend`, `.DKIM_Add`, `.createBody`, `.addOrEnqueueAnAddress`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `FPDF` connect `FPDF` to `._parsepngstream`, `._textstring`, `MailerService`, `Exception`, `._put`, `._out`, `.preSend`, `.AddPage`, `.AddFont`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Are the 37 inferred relationships involving `Exception` (e.g. with `.getConnection()` and `.Error()`) actually correct?**
  _`Exception` has 37 INFERRED edges - model-reasoned connections that need verification._
- **Are the 28 inferred relationships involving `jsonResponse()` (e.g. with `.forgotPassword()` and `.login()`) actually correct?**
  _`jsonResponse()` has 28 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `description`, `type` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PHPMailer` be split into smaller, more focused modules?**
  _Cohesion score 0.03648863035430989 - nodes in this community are weakly interconnected._