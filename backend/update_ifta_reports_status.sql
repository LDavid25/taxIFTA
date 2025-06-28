-- 1. Verificar los estados actuales
SELECT 'Estados actuales en ifta_reports:' as message;
SELECT status, COUNT(*) as count 
FROM ifta_reports 
GROUP BY status;

-- 2. Actualizar estados antiguos a los nuevos valores
-- Primero, deshabilitar temporalmente la restricción de verificación si existe
ALTER TABLE ifta_reports 
  DROP CONSTRAINT IF EXISTS ifta_reports_status_check;

-- 3. Actualizar los estados
-- Caso 1: Estados que deben cambiar a 'sent'
UPDATE ifta_reports 
SET status = 'sent',
    updated_at = CURRENT_TIMESTAMP
WHERE status IN ('submitted', 'in_review', 'approved');

-- Caso 2: Estados que deben cambiar a 'in_progress'
UPDATE ifta_reports 
SET status = 'in_progress',
    updated_at = CURRENT_TIMESTAMP
WHERE status NOT IN ('sent', 'rejected', 'completed');

-- 4. Volver a crear la restricción
ALTER TABLE ifta_reports
  ADD CONSTRAINT ifta_reports_status_check 
  CHECK (status IN ('in_progress', 'sent', 'rejected', 'completed'));

-- 5. Verificar los cambios
SELECT 'Nueva distribución de estados:' as message;
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ifta_reports), 2) as percentage
FROM ifta_reports 
GROUP BY status
ORDER BY count DESC;
