-- Ejecutar una vez sobre la base existente, antes de publicar el código.
ALTER TABLE inscripciones_curso
  MODIFY estado ENUM('Pendiente', 'Contactado', 'Inscripto', 'completado') NOT NULL DEFAULT 'Pendiente',
  ADD COLUMN fecha_finalizacion DATETIME NULL AFTER fecha;

CREATE TABLE IF NOT EXISTS certificados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inscripcion_id INT NULL,
  curso_id VARCHAR(50) NOT NULL,
  codigo_certificado VARCHAR(50) NOT NULL,
  token_validacion CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  nombre_alumno VARCHAR(201) NOT NULL,
  nombre_curso VARCHAR(255) NOT NULL,
  instructor VARCHAR(150) NOT NULL,
  fecha_finalizacion DATETIME NOT NULL,
  fecha_emision DATETIME NOT NULL,
  estado ENUM('valido', 'revocado') NOT NULL DEFAULT 'valido',
  pdf LONGBLOB NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_certificado_inscripcion (inscripcion_id),
  UNIQUE KEY uq_certificado_codigo (codigo_certificado),
  UNIQUE KEY uq_certificado_token (token_validacion),
  CONSTRAINT fk_certificado_inscripcion FOREIGN KEY (inscripcion_id)
    REFERENCES inscripciones_curso(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
