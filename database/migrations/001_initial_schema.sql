-- Crear extensión para UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de compañías
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  phone VARCHAR(50),
  email VARCHAR(255),
  tax_id VARCHAR(100),
  ifta_account_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'client')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de vehículos
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  license_plate VARCHAR(50) NOT NULL,
  vin_number VARCHAR(100),
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  fuel_type VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, license_plate)
);

-- Tabla de viajes
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  trip_date DATE NOT NULL,
  state VARCHAR(100) NOT NULL,
  start_odometer DECIMAL(10, 2) NOT NULL,
  end_odometer DECIMAL(10, 2) NOT NULL,
  total_miles DECIMAL(10, 2) GENERATED ALWAYS AS (end_odometer - start_odometer) STORED,
  gallons DECIMAL(10, 3) NOT NULL,
  mpg DECIMAL(10, 2) GENERATED ALWAYS AS (CASE WHEN gallons > 0 THEN (end_odometer - start_odometer) / gallons ELSE 0 END) STORED,
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de declaraciones trimestrales
CREATE TABLE IF NOT EXISTS declarations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'completed', 'cancelled')),
  total_miles DECIMAL(12, 2) DEFAULT 0,
  total_taxable_miles DECIMAL(12, 2) DEFAULT 0,
  total_gallons DECIMAL(12, 3) DEFAULT 0,
  total_tax_due DECIMAL(12, 2) DEFAULT 0,
  is_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, year, quarter)
);

-- Tabla de tasas de impuestos por estado
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) UNIQUE NOT NULL,
  state_name VARCHAR(100) NOT NULL,
  rate_per_gallon DECIMAL(6, 4) NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de detalles de declaración (desglose por estado)
CREATE TABLE IF NOT EXISTS declaration_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  declaration_id UUID REFERENCES declarations(id) ON DELETE CASCADE,
  state_code VARCHAR(2) NOT NULL,
  miles DECIMAL(12, 2) NOT NULL,
  gallons DECIMAL(12, 3) NOT NULL,
  tax_rate DECIMAL(6, 4) NOT NULL,
  tax_due DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(declaration_id, state_code)
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_trips_company_date ON trips(company_id, trip_date);
CREATE INDEX idx_trips_vehicle_date ON trips(vehicle_id, trip_date);
CREATE INDEX idx_declarations_company_year_quarter ON declarations(company_id, year, quarter);
CREATE INDEX idx_declaration_details_declaration ON declaration_details(declaration_id);

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

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_declarations_updated_at
BEFORE UPDATE ON declarations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_rates_updated_at
BEFORE UPDATE ON tax_rates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_declaration_details_updated_at
BEFORE UPDATE ON declaration_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuario administrador por defecto (cambiar la contraseña después)
-- La contraseña es 'admin123' (hasheada con bcrypt)
INSERT INTO companies (id, name, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'Empresa Administradora', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, password, name, role, company_id, is_active, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'admin@iftaeasytax.com',
  '$2a$10$FB/BOAVhpuLvpOREQVmvmezD4ED/.JBIDRh70tGevYzYzQgFId2u.', -- admin123 - password
  'Administrador del Sistema',
  'admin',
  '11111111-1111-1111-1111-111111111111',
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;
