# Marian Estilista — Documentación Técnica del Backend (PHP + MySQL)

Este documento detalla la arquitectura, configuración, endpoints y guía de instalación del backend para **Marian Estilista**, salón exclusivo de peluquería femenina y colorimetría profesional en San Carlos de Bariloche.

---

## 1. Estructura del Proyecto

El proyecto está organizado siguiendo una arquitectura limpia y modular en capas con PHP puro (sin frameworks externos):

```text
marian-estilista/
│
├── frontend/                     # Aplicación web para el cliente y administración
│   ├── index.html                # Landing page principal
│   ├── pages/
│   │   ├── reservas.html         # Asistente de reservas en 6 pasos
│   │   ├── login.html            # Pantalla de inicio de sesión
│   │   ├── registro.html         # Registro de nuevos clientes
│   │   ├── mis-reservas.html     # Historial y cancelación de turnos de la clienta
│   │   └── admin.html            # Panel de administración y métricas
│   ├── css/
│   │   ├── styles.css            # Estilos base y landing page
│   │   ├── reservas.css          # Estilos del wizard de turnos
│   │   ├── admin.css             # Estilos del panel de administración
│   │   └── auth.css              # Estilos de login, registro y dropdown
│   ├── js/
│   │   ├── api.js                # Cliente HTTP (fetch) para comunicarse con PHP
│   │   ├── auth.js               # Control de sesión y actualización de navegación
│   │   ├── reservas.js           # Lógica interactiva del asistente de citas
│   │   ├── main.js               # Lógica de landing, carrusel y mapa
│   │   └── admin.js              # Lógica del panel administrativo
│   └── assets/                   # Fotografías e iconos
│
└── backend/                      # API REST y lógica del servidor
    ├── config/                   # Configuración global y conexión a base de datos
    │   ├── Database.php          # Conexión PDO Singleton segura
    │   ├── config.php            # Parámetros de conexión, sesiones y CORS
    │   ├── helpers.php           # Respuestas JSON estándar y autorización
    │   └── init_db.php           # Script de inicialización automática de la BD
    │
    ├── models/                   # Representación de entidades de datos
    │   ├── Usuario.php
    │   ├── Profesional.php
    │   ├── Servicio.php
    │   └── Reserva.php
    │
    ├── repositories/             # Capa de acceso a datos (consultas SQL con PDO)
    │   ├── UsuarioRepository.php
    │   ├── ProfesionalRepository.php
    │   ├── ServicioRepository.php
    │   └── ReservaRepository.php
    │
    ├── services/                 # Capa de reglas y lógica de negocio
    │   ├── AuthService.php
    │   ├── ProfesionalService.php
    │   ├── ServicioService.php
    │   └── ReservaService.php
    │
    ├── controllers/              # Receptores de peticiones HTTP
    │   ├── AuthController.php
    │   ├── UsuarioController.php
    │   ├── ProfesionalController.php
    │   ├── ServicioController.php
    │   └── ReservaController.php
    │
    ├── api/                      # Endpoints HTTP REST (rutas)
    │   ├── auth/                 # register.php, login.php, logout.php, me.php
    │   ├── servicios/            # list.php, get.php, create.php, update.php, delete.php
    │   ├── profesionales/        # list.php, get.php
    │   ├── reservas/             # list.php, create.php, update.php, delete.php, disponibilidad.php
    │   └── usuarios/             # list.php
    │
    └── sql/                      # Scripts de base de datos
        ├── schema.sql            # Creación de base de datos y tablas
        └── seed.sql              # Datos iniciales (usuarios, Mariano, servicios y turnos)
```

---

## 2. Descripción de las Capas Backend

| Capa | Responsabilidad |
| :--- | :--- |
| **Config** (`backend/config/`) | Gestiona las variables de entorno, la inicialización de la conexión PDO (`Database.php`), las cookies de sesión seguras (`HttpOnly`, `SameSite`), las cabeceras CORS y las respuestas JSON estándar. |
| **Models** (`backend/models/`) | Representan las entidades del dominio (`Usuario`, `Servicio`, `Profesional`, `Reserva`). Incluyen métodos como `toSafeArray()` para garantizar que nunca se expongan contraseñas. |
| **Repositories** (`backend/repositories/`) | Se encargan **exclusivamente** de ejecutar sentencias SQL preparadas (`prepared statements` de PDO), evitando la inyección de SQL. No contienen lógica de negocio ni manipulación HTTP. |
| **Services** (`backend/services/`) | Contienen la **lógica de negocio**: validación de fechas (días de atención martes a sábado de 11:00 a 19:00 hs), cálculo de colisiones horarias para evitar dobles reservas, encriptación con `password_hash()` y autorización de acceso. |
| **Controllers** (`backend/controllers/`) | Reciben las peticiones, leen los datos de entrada (`getRequestData()`), invocan al servicio correspondiente y emiten la respuesta JSON con códigos HTTP adecuados. |
| **API** (`backend/api/`) | Puntos de entrada HTTP livianos que instancian al controlador respectivo. |

---

## 3. Base de Datos MySQL (`marian_estilista`)

### Tablas Principales:
1. **`usuarios`**:
   - Campos: `id`, `nombre`, `apellido`, `email` (único), `password` (hasheado con BCRYPT), `telefono`, `rol` (`CLIENTE` o `ADMIN`), `activo`, `created_at`, `updated_at`.
2. **`profesionales`**:
   - Campos: `id`, `nombre`, `apellido`, `especialidad`, `descripcion`, `imagen`, `activo`, `created_at`.
3. **`servicios`**:
   - Campos: `id`, `nombre`, `categoria`, `descripcion`, `precio`, `duracion_minutos`, `imagen`, `destacado`, `activo`, `created_at`, `updated_at`.
4. **`reservas`**:
   - Campos: `id`, `usuario_id`, `profesional_id`, `servicio_id`, `fecha`, `hora`, `duracion_minutos`, `precio`, `estado` (`PENDIENTE`, `CONFIRMADA`, `CANCELADA`, `COMPLETADA`), `observaciones`, `created_at`, `updated_at`.
   - Claves foráneas referenciando a `usuarios(id)`, `profesionales(id)` y `servicios(id)`.

---

## 4. Guía de Instalación y Configuración Local

### Requisitos:
- **XAMPP** o **Laragon** con:
  - Apache 2.4+
  - PHP 7.4+ u 8.x con extensión `pdo_mysql` habilitada
  - MySQL / MariaDB

### Paso 1: Ubicación del Proyecto
Copia o mueve la carpeta del proyecto dentro de la raíz web de tu servidor:
- **XAMPP:** `C:\xampp\htdocs\marian-estilista\`
- **Laragon:** `C:\laragon\www\marian-estilista\`

### Paso 2: Configuración de Base de Datos
Abre `backend/config/config.php` y verifica las credenciales de MySQL (por defecto en XAMPP y Laragon el usuario es `root` sin contraseña):

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'marian_estilista');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', '3306');
```

### Paso 3: Inicializar la Base de Datos
Tienes dos alternativas muy sencillas:

#### Opción A (Recomendada - 1 solo clic desde el navegador):
1. Inicia los servicios **Apache** y **MySQL** desde el panel de XAMPP o Laragon.
2. Abre tu navegador e ingresa a:
   `http://localhost/marian-estilista/backend/config/init_db.php`
3. El script creará automáticamente la base de datos `marian_estilista`, las 4 tablas con sus relaciones y cargará los datos semilla.

#### Opción B (Manual desde phpMyAdmin o consola MySQL):
1. Ingresa a `http://localhost/phpmyadmin/`.
2. Ejecuta el archivo `backend/sql/schema.sql`.
3. Ejecuta el archivo `backend/sql/seed.sql`.

---

## 5. Cuentas de Prueba Preconfiguradas (Desarrollo)

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@marianestilista.com` | `Admin123!` | Acceso completo al Panel Admin (`/pages/admin.html`), gestión de todos los turnos, servicios y usuarios. |
| **CLIENTE** | `camila@gmail.com` | `Cliente123!` | Reservar turnos, consultar historial en "Mis Reservas" y cancelar sus propias citas. |
| **CLIENTE** | `luciana@gmail.com` | `Cliente123!` | Reservar turnos, consultar historial en "Mis Reservas" y cancelar sus propias citas. |

---

## 6. Catálogo de la API REST

Todas las respuestas utilizan cabecera `Content-Type: application/json` y siguen el formato estándar:

```json
{
  "success": true,
  "message": "Operación completada exitosamente",
  "data": { ... }
}
```

En caso de error:

```json
{
  "success": false,
  "message": "El horario seleccionado ya no se encuentra disponible.",
  "error": "SCHEDULE_UNAVAILABLE"
}
```

### Autenticación (`/api/auth/`)
- `POST /api/auth/register.php`: Registra un nuevo usuario (fuerza rol `CLIENTE`).
- `POST /api/auth/login.php`: Inicia sesión mediante email y contraseña (`password_verify`).
- `POST /api/auth/logout.php`: Cierra la sesión activa y elimina la cookie de sesión.
- `GET  /api/auth/me.php`: Devuelve el usuario actualmente autenticado en la sesión.

### Catálogo de Servicios (`/api/servicios/`)
- `GET  /api/servicios/list.php`: Lista servicios activos (o todos si se envía `?todos=1`).
- `GET  /api/servicios/get.php?id=X`: Obtiene el detalle de un servicio.
- `POST /api/servicios/create.php`: [ADMIN] Crea un nuevo servicio.
- `POST /api/servicios/update.php`: [ADMIN] Actualiza un servicio existente.
- `POST /api/servicios/delete.php`: [ADMIN] Da de baja lógica un servicio.

### Profesionales (`/api/profesionales/`)
- `GET  /api/profesionales/list.php`: Lista profesionales disponibles.
- `GET  /api/profesionales/get.php?id=X`: Obtiene detalles del profesional (por defecto Mariano).

### Reservas y Disponibilidad (`/api/reservas/`)
- `GET  /api/reservas/disponibilidad.php?fecha=AAAA-MM-DD&duracion=minutos`: Retorna la grilla de slots de 30 minutos indicando si cada franja está disponible u ocupada.
- `GET  /api/reservas/list.php`: Lista las reservas del usuario autenticado (si es ADMIN, lista todas).
- `POST /api/reservas/create.php`: Registra una nueva cita verificando disponibilidad y previniendo colisiones horarias.
- `POST /api/reservas/update.php`: Actualiza el estado (`PENDIENTE`, `CONFIRMADA`, `CANCELADA`, `COMPLETADA`).
- `POST /api/reservas/delete.php`: Cancela la reserva (permitido para el cliente titular o admin).

---

## 7. Flujo de Trabajo de las Reservas

```text
Clienta selecciona servicio (Paso 1)
        ↓
Selecciona fecha en calendario (Paso 2)
        ↓
Frontend consulta GET /api/reservas/disponibilidad.php?fecha=...
        ↓
Backend calcula franjas libres según horarios de apertura (11:00 a 19:00) y reservas en MySQL
        ↓
Clienta selecciona horario disponible (Paso 3)
        ↓
Formulario autocompletado si tiene sesión iniciada (Paso 4)
        ↓
Revisión del resumen (Paso 5)
        ↓
Confirmación (Paso 6): POST /api/reservas/create.php
        ↓
ReservaService valida superposiciones horarias y permisos
        ↓
Se persiste en MySQL y se emite confirmación con código de reserva
```
