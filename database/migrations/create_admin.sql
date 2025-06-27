-- Crear la compañía administradora si no existe
INSERT INTO companies (
    id,
    name,
    address,
    city,
    state,
    zip_code,
    phone,
    email,
    distribution_emails
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'IFTA Easy Tax',
    'Calle Principal 123',
    'Ciudad',
    'CA',
    '12345',
    '+1234567890',
    'admin@iftaeasytax.com',
    '["admin@iftaeasytax.com"]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Crear el usuario administrador principal
INSERT INTO users (
    id,
    email,
    password,
    name,
    role,
    company_id,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin@iftaeasytax.com',
    -- Contraseña: 'admin123' (hasheada con bcrypt)
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Administrador Principal',
    'admin',
    '11111111-1111-1111-1111-111111111111',
    true
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    is_active = true,
    updated_at = NOW();

-- Crear un usuario administrador secundario (opcional)
INSERT INTO users (
    id,
    email,
    password,
    name,
    role,
    company_id,
    is_active
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'admin2@iftaeasytax.com',
    -- Contraseña: 'admin123' (hasheada con bcrypt)
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Administrador Secundario',
    'admin',
    '11111111-1111-1111-1111-111111111111',
    true
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    is_active = true,
    updated_at = NOW();

-- Verificar que el usuario se creó correctamente
SELECT id, email, name, role, is_active, last_login 
FROM users 
WHERE email = 'admin2@iftaeasytax.com';
