-- Esquema simplificado para el sistema de impuestos IFTA
-- Basado en 001_initial_schema.sql
-- Fecha de creación: 2024-05-30

-- Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de compañías (simplificada)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  distribution_emails JSONB CHECK (json_array_length(distribution_emails) BETWEEN 1 AND 10),
  ifta_account_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios (simplificada)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'cliente')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reportes IFTA
CREATE TABLE IF NOT EXISTS ifta_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  vehicle_plate VARCHAR(20) NOT NULL,  -- Matrícula del vehículo como texto simple
  report_year INTEGER NOT NULL,
  report_month INTEGER NOT NULL CHECK (report_month BETWEEN 1 AND 12),
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('sent', 'rejected', 'in_progress', 'completed')),
  total_miles DECIMAL(12, 2) DEFAULT 0,
  total_gallons DECIMAL(12, 3) DEFAULT 0,
  total_tax_due DECIMAL(12, 2) DEFAULT 0,
  notes VARCHAR(256),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, vehicle_plate, report_year, report_month)
);

-- Tabla de detalles del reporte por estado
CREATE TABLE IF NOT EXISTS ifta_report_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES ifta_reports(id) ON DELETE CASCADE NOT NULL,
  state_code CHAR(2) NOT NULL,
  miles DECIMAL(12, 2) NOT NULL,
  gallons DECIMAL(12, 3) NOT NULL,
  mpg DECIMAL(10, 2) GENERATED ALWAYS AS (
    CASE WHEN gallons > 0 THEN miles / NULLIF(gallons, 0) ELSE 0 END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_id, state_code),
  CONSTRAINT positive_miles CHECK (miles >= 0),
  CONSTRAINT positive_gallons CHECK (gallons >= 0)
);

-- Tabla para agrupar reportes por trimestre
CREATE TABLE IF NOT EXISTS ifta_quarterly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, quarter, year)
);

-- Añadir columna de referencia al trimestre
ALTER TABLE ifta_reports 
  ADD COLUMN quarterly_report_id UUID 
  REFERENCES ifta_quarterly_reports(id) ON DELETE SET NULL;

-- Índice para búsquedas por trimestre
CREATE INDEX idx_ifta_reports_quarterly ON ifta_reports(quarterly_report_id);

-- Índice para búsquedas por trimestre y año
CREATE INDEX idx_ifta_reports_quarter_year ON ifta_reports(report_year, quarter);

-- Tabla para almacenar archivos adjuntos de los reportes IFTA
CREATE TABLE IF NOT EXISTS ifta_report_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES ifta_reports(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,  -- MIME type del archivo
  file_size BIGINT NOT NULL,         -- Tamaño en bytes
  file_path TEXT NOT NULL,           -- Ruta donde se almacena el archivo
  file_extension VARCHAR(10),        -- Extensión del archivo (opcional)
  description TEXT,                  -- Descripción opcional del archivo
  note VARCHAR(100),                 -- Nota adicional (máx. 100 caracteres)
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,  -- Usuario que subió el archivo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Restricciones adicionales
  CONSTRAINT valid_file_type CHECK (
    file_type IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg'
    )
  ),
  CONSTRAINT max_file_size CHECK (file_size <= 10485760)  -- Límite de 10MB por archivo
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_ifta_attachments_report ON ifta_report_attachments(report_id);
CREATE INDEX idx_ifta_attachments_uploaded_by ON ifta_report_attachments(uploaded_by);

-- Comentarios para documentación
COMMENT ON TABLE ifta_report_attachments IS 'Almacena los archivos adjuntos asociados a los reportes IFTA';
COMMENT ON COLUMN ifta_report_attachments.note IS 'Nota opcional para el archivo adjunto (máx. 100 caracteres)';

-- Índices para mejorar el rendimiento
CREATE INDEX idx_ifta_reports_company_plate ON ifta_reports(company_id, vehicle_plate);
CREATE INDEX idx_ifta_reports_period ON ifta_reports(report_year, report_month);
CREATE INDEX idx_ifta_reports_status ON ifta_reports(status);
CREATE INDEX idx_ifta_reports_status ON ifta_reports(status);
CREATE INDEX idx_ifta_report_states_report ON ifta_report_states(report_id);
CREATE INDEX idx_ifta_quarterly_reports_company ON ifta_quarterly_reports(company_id);


-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar automáticamente updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- Usuario administrador por defecto (contraseña: admin123)
-- Nota: La contraseña debe ser hasheada en la aplicación
INSERT INTO companies (id, name, state, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'Empresa Administradora', 'CA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE companies IS 'Información de las compañías que utilizan el sistema';
COMMENT ON TABLE users IS 'Usuarios del sistema (admin o cliente)';
COMMENT ON COLUMN users.role IS 'Rol del usuario: admin (acceso total) o cliente (acceso limitado a su compañía)';
COMMENT ON TABLE ifta_report_attachments IS 'Almacena los archivos adjuntos asociados a los reportes IFTA';
COMMENT ON COLUMN ifta_report_attachments.note IS 'Nota opcional para el archivo adjunto (máx. 100 caracteres)';

