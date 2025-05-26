-- Insertar tasas de impuestos IFTA por estado (valores de ejemplo)
-- Nota: Estas son tasas de ejemplo y deben actualizarse con los valores reales

-- Primero, desactivar cualquier tasa existente
UPDATE tax_rates SET is_active = false, updated_at = CURRENT_TIMESTAMP;

-- Insertar las nuevas tasas (ejemplo para 2024)
INSERT INTO tax_rates (state_code, state_name, rate_per_gallon, effective_date, expiration_date, is_active)
VALUES
-- Región Noreste
('CT', 'Connecticut', 0.4490, '2024-01-01', '2024-12-31', true),
('DE', 'Delaware', 0.4400, '2024-01-01', '2024-12-31', true),
('ME', 'Maine', 0.3500, '2024-01-01', '2024-12-31', true),
('MD', 'Maryland', 0.3695, '2024-01-01', '2024-12-31', true),
('MA', 'Massachusetts', 0.26, '2024-01-01', '2024-12-31', true),
('NH', 'New Hampshire', 0.30, '2024-01-01', '2024-12-31', true),
('NJ', 'New Jersey', 0.41, '2024-01-01', '2024-12-31', true),
('NY', 'New York', 0.43, '2024-01-01', '2024-12-31', true),
('PA', 'Pennsylvania', 0.55, '2024-01-01', '2024-12-31', true),
('RI', 'Rhode Island', 0.35, '2024-01-01', '2024-12-31', true),
('VT', 'Vermont', 0.31, '2024-01-01', '2024-12-31', true),

-- Región Sureste
('AL', 'Alabama', 0.29, '2024-01-01', '2024-12-31', true),
('AR', 'Arkansas', 0.292, '2024-01-01', '2024-12-31', true),
('FL', 'Florida', 0.36, '2024-01-01', '2024-12-31', true),
('GA', 'Georgia', 0.31, '2024-01-01', '2024-12-31', true),
('KY', 'Kentucky', 0.28, '2024-01-01', '2024-12-31', true),
('LA', 'Louisiana', 0.20, '2024-01-01', '2024-12-31', true),
('MS', 'Mississippi', 0.18, '2024-01-01', '2024-12-31', true),
('NC', 'North Carolina', 0.40, '2024-01-01', '2024-12-31', true),
('SC', 'South Carolina', 0.26, '2024-01-01', '2024-12-31', true),
('TN', 'Tennessee', 0.30, '2024-01-01', '2024-12-31', true),
('VA', 'Virginia', 0.26, '2024-01-01', '2024-12-31', true),
('WV', 'West Virginia', 0.36, '2024-01-01', '2024-12-31', true),

-- Región Medio Oeste
('IL', 'Illinois', 0.45, '2024-01-01', '2024-12-31', true),
('IN', 'Indiana', 0.51, '2024-01-01', '2024-12-31', true),
('IA', 'Iowa', 0.33, '2024-01-01', '2024-12-31', true),
('KS', 'Kansas', 0.26, '2024-01-01', '2024-12-31', true),
('MI', 'Michigan', 0.47, '2024-01-01', '2024-12-31', true),
('MN', 'Minnesota', 0.32, '2024-01-01', '2024-12-31', true),
('MO', 'Missouri', 0.22, '2024-01-01', '2024-12-31', true),
('NE', 'Nebraska', 0.28, '2024-01-01', '2024-12-31', true),
('ND', 'North Dakota', 0.28, '2024-01-01', '2024-12-31', true),
('OH', 'Ohio', 0.47, '2024-01-01', '2024-12-31', true),
('OK', 'Oklahoma', 0.22, '2024-01-01', '2024-12-31', true),
('SD', 'South Dakota', 0.30, '2024-01-01', '2024-12-31', true),
('WI', 'Wisconsin', 0.33, '2024-01-01', '2024-12-31', true),

-- Región Oeste
('AZ', 'Arizona', 0.26, '2024-01-01', '2024-12-31', true),
('CA', 'California', 0.47, '2024-01-01', '2024-12-31', true),
('CO', 'Colorado', 0.27, '2024-01-01', '2024-12-31', true),
('ID', 'Idaho', 0.35, '2024-01-01', '2024-12-31', true),
('MT', 'Montana', 0.32, '2024-01-01', '2024-12-31', true),
('NV', 'Nevada', 0.29, '2024-01-01', '2024-12-31', true),
('NM', 'New Mexico', 0.21, '2024-01-01', '2024-12-31', true),
('OR', 'Oregon', 0.38, '2024-01-01', '2024-12-31', true),
('TX', 'Texas', 0.20, '2024-01-01', '2024-12-31', true),
('UT', 'Utah', 0.31, '2024-01-01', '2024-12-31', true),
('WA', 'Washington', 0.49, '2024-01-01', '2024-12-31', true),
('WY', 'Wyoming', 0.29, '2024-01-01', '2024-12-31', true),

-- Región de las Montañas Rocosas
('CO', 'Colorado', 0.27, '2024-01-01', '2024-12-31', true),
('ID', 'Idaho', 0.35, '2024-01-01', '2024-12-31', true),
('MT', 'Montana', 0.32, '2024-01-01', '2024-12-31', true),
('UT', 'Utah', 0.31, '2024-01-01', '2024-12-31', true),
('WY', 'Wyoming', 0.29, '2024-01-01', '2024-12-31', true),

-- Región del Pacífico
('AK', 'Alaska', 0.15, '2024-01-01', '2024-12-31', true),
('CA', 'California', 0.47, '2024-01-01', '2024-12-31', true),
('HI', 'Hawaii', 0.16, '2024-01-01', '2024-12-31', true),
('OR', 'Oregon', 0.38, '2024-01-01', '2024-12-31', true),
('WA', 'Washington', 0.49, '2024-01-01', '2024-12-31', true)

-- Asegurarse de que no haya códigos de estado duplicados
ON CONFLICT (state_code) 
DO UPDATE SET 
  rate_per_gallon = EXCLUDED.rate_per_gallon,
  effective_date = EXCLUDED.effective_date,
  expiration_date = EXCLUDED.expiration_date,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;
