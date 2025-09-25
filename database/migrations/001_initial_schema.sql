-- Esquema completo para el sistema de impuestos IFTA
-- Incluye todas las tablas, índices, funciones y triggers necesarios
-- Fecha de creación: 2024-06-22

-- Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para obtener el trimestre a partir del mes
CREATE OR REPLACE FUNCTION get_quarter(month_num INTEGER) 
RETURNS INTEGER AS $$
BEGIN
  RETURN ((month_num - 1) / 3) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función de ayuda para obtener el nombre del trimestre
CREATE OR REPLACE FUNCTION get_quarter_name(quarter_num INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN quarter_num = 1 THEN 'Q1 (Ene-Mar)'
    WHEN quarter_num = 2 THEN 'Q2 (Abr-Jun)'
    WHEN quarter_num = 3 THEN 'Q3 (Jul-Sep)'
    WHEN quarter_num = 4 THEN 'Q4 (Oct-Dic)'
    ELSE 'Trimestre inválido'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Tabla de compañías (simplificada)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address JSONB,
  contact_email VARCHAR(255),
  phone VARCHAR(50),
  distribution_emails JSONB CHECK (jsonb_array_length(distribution_emails) BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios (simplificada)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para agrupar reportes por trimestre
CREATE TABLE IF NOT EXISTS ifta_quarterly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  year INTEGER NOT NULL,
  name TEXT GENERATED ALWAYS AS (get_quarter_name(quarter) || ' ' || year) STORED,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'sent', 'rejected', 'completed', 'trash')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, quarter, year)
);

-- Comentarios para la tabla de reportes trimestrales
COMMENT ON TABLE ifta_quarterly_reports IS 'Grupos trimestrales obligatorios para los reportes IFTA. Cada reporte debe pertenecer a un grupo que representa un trimestre del año.';
COMMENT ON COLUMN ifta_quarterly_reports.quarter IS 'Trimestre del año (1-4). 1: Ene-Mar, 2: Abr-Jun, 3: Jul-Sep, 4: Oct-Dic';
COMMENT ON COLUMN ifta_quarterly_reports.status IS 'Estado del reporte: in_progress, sent, rejected, completed';

-- Tabla de reportes IFTA
CREATE TABLE IF NOT EXISTS ifta_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  vehicle_plate VARCHAR(20) NOT NULL,  -- Matrícula del vehículo como texto simple
  report_year INTEGER NOT NULL,
  report_month INTEGER NOT NULL CHECK (report_month BETWEEN 1 AND 12),
  quarter INTEGER GENERATED ALWAYS AS (get_quarter(report_month)) STORED,  -- Trimestre calculado automáticamente
  quarterly_report_id UUID REFERENCES ifta_quarterly_reports(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('sent', 'rejected', 'in_progress', 'completed')),
  total_miles DECIMAL(12, 2) DEFAULT 0,
  total_gallons DECIMAL(12, 3) DEFAULT 0,
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

-- Índices para mejorar el rendimiento
CREATE INDEX idx_ifta_reports_company_plate ON ifta_reports(company_id, vehicle_plate);
CREATE INDEX idx_ifta_reports_period ON ifta_reports(report_year, report_month);
CREATE INDEX idx_ifta_reports_status ON ifta_reports(status);
CREATE INDEX idx_ifta_report_states_report ON ifta_report_states(report_id);
CREATE INDEX idx_ifta_quarterly_reports_company ON ifta_quarterly_reports(company_id);


-- Función para validar que un reporte pertenece al trimestre correcto
CREATE OR REPLACE FUNCTION validate_report_quarter()
RETURNS TRIGGER AS $$
DECLARE
  group_quarter INTEGER;
  report_quarter INTEGER;
  group_year INTEGER;
BEGIN
  -- Si no hay un grupo asignado, no hay nada que validar
  IF NEW.quarterly_report_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obtenemos el trimestre y año del grupo
  SELECT quarter, year INTO group_quarter, group_year 
  FROM ifta_quarterly_reports 
  WHERE id = NEW.quarterly_report_id;
  
  -- Verificamos que coincidan el trimestre y el año
  IF group_quarter != NEW.quarter OR group_year != NEW.report_year THEN
    RAISE EXCEPTION 'El trimestre o año del reporte no coincide con el grupo trimestral asignado';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar que el reporte pertenece al trimestre correcto
CREATE TRIGGER validate_report_quarter_trigger
BEFORE INSERT OR UPDATE OF quarterly_report_id, report_month, report_year ON ifta_reports
FOR EACH ROW
EXECUTE FUNCTION validate_report_quarter();

-- Trigger para actualizar automáticamente el nombre del grupo trimestral
CREATE OR REPLACE FUNCTION update_quarterly_report_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := get_quarter_name(NEW.quarter) || ' ' || NEW.year::TEXT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quarterly_report_name_trigger
BEFORE INSERT OR UPDATE OF quarter, year ON ifta_quarterly_reports
FOR EACH ROW
EXECUTE FUNCTION update_quarterly_report_name();

-- Trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Usuario administrador por defecto (contraseña: admin123)
-- Nota: La contraseña debe ser hasheada en la aplicación
INSERT INTO companies (id, name, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'Empresa Administradora', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE companies IS 'Información de las compañías que utilizan el sistema';
COMMENT ON TABLE users IS 'Usuarios del sistema (admin o cliente)';
COMMENT ON COLUMN users.role IS 'Rol del usuario: admin (acceso total) o cliente (acceso limitado a su compañía)';
COMMENT ON TABLE ifta_report_attachments IS 'Almacena los archivos adjuntos asociados a los reportes IFTA';

-- Migración de datos iniciales
-- Actualizar reportes existentes al nuevo estado por defecto 'in_progress'
-- Solo actualiza los reportes que no tienen un estado válido en el nuevo esquema
DO $$
BEGIN
    -- Verificar si la tabla ifta_quarterly_reports existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ifta_quarterly_reports') THEN
        -- Actualizar estados inválidos a 'in_progress'
        UPDATE ifta_quarterly_reports 
        SET status = 'in_progress' 
        WHERE status NOT IN ('in_progress', 'sent', 'rejected', 'completed');
        
        -- Actualizar estados antiguos a 'sent'
        UPDATE ifta_quarterly_reports 
        SET status = 'sent'
        WHERE status IN ('submitted', 'in_review', 'approved');
        
        -- Verificar que no queden estados inválidos
        -- Esta consulta debería devolver 0 filas si todo está correcto
        RAISE NOTICE 'Verificando estados inválidos...';
        PERFORM id, status 
        FROM ifta_quarterly_reports 
        WHERE status NOT IN ('in_progress', 'sent', 'rejected', 'completed');
        
        IF FOUND THEN
            RAISE NOTICE 'Se encontraron estados inválidos en la tabla ifta_quarterly_reports';
        END IF;
    END IF;
END $$;

