-- Primero, asegurémonos de que exista una compañía
INSERT INTO companies (
    id,
    name,
    address,
    city,
    state,
    zip_code,
    country,
    phone,
    email,
    tax_id
) VALUES (
    '11111111-1111-1111-1111-111111111112',
    'IFTA Easy Tax',
    'Calle Principal 123',
    'Ciudad',
    'Estado',
    '12345',
    'País',
    '1234567890',
    'info@iftaeasytax.com',
    'TAX123456789'
) ON CONFLICT (id) DO NOTHING;

-- Crear el usuario administrador
INSERT INTO users (
    id,
    email,
    password,
    name,
    role,
    company_id,
    is_active,
    last_login
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'admin2@iftaeasytax.com',
    -- Contraseña: 'root' (hasheada con bcrypt)
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Admin 2',
    'admin',
    '11111111-1111-1111-1111-111111111112',
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    is_active = true,
    updated_at = NOW();

-- Verificar que el usuario se creó correctamente
SELECT id, email, name, role, is_active, last_login 
FROM users 
WHERE email = 'admin2@iftaeasytax.com';
