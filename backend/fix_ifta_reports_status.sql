-- 1. Primero, verificar la restricción actual
SELECT conname, pg_get_constraintdef(oid)
FROM   pg_constraint 
WHERE  conrelid = 'ifta_reports'::regclass
AND    contype = 'c';

-- 2. Eliminar la restricción de verificación existente si existe
ALTER TABLE ifta_reports 
  DROP CONSTRAINT IF EXISTS ifta_reports_status_check,
  DROP CONSTRAINT IF EXISTS check_report_status;

-- 3. Actualizar los estados
-- Convertir 'draft' a 'in_progress'
UPDATE ifta_reports 
SET status = 'in_progress',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'draft';

-- 4. Verificar que no queden estados inválidos
SELECT 'Estados inválidos restantes:' as message, status, COUNT(*) 
FROM ifta_reports 
WHERE status NOT IN ('in_progress', 'sent', 'rejected', 'completed')
GROUP BY status;

-- 5. Volver a crear la restricción
ALTER TABLE ifta_reports
  ADD CONSTRAINT ifta_reports_status_check 
  CHECK (status IN ('in_progress', 'sent', 'rejected', 'completed'));

-- 6. Verificar los cambios finales
SELECT 'Distribución final de estados:' as message;
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM ifta_reports), 0), 2) as percentage
FROM ifta_reports 
GROUP BY status
ORDER BY count DESC;
