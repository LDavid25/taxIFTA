-- Actualizar reportes existentes al nuevo estado por defecto 'in_progress'
-- Solo actualiza los reportes que no tienen un estado válido en el nuevo esquema
UPDATE ifta_quarterly_reports 
SET status = 'in_progress',
    updated_at = CURRENT_TIMESTAMP
WHERE status NOT IN ('in_progress', 'sent', 'rejected', 'completed');

-- Actualizar los estados antiguos a los nuevos valores equivalentes
UPDATE ifta_quarterly_reports 
SET status = 'sent',
    updated_at = CURRENT_TIMESTAMP
WHERE status IN ('submitted', 'in_review', 'approved');

-- Verificar que no queden estados inválidos
SELECT 'Reportes con estados inválidos:' as message, COUNT(*) as count 
FROM ifta_quarterly_reports 
WHERE status NOT IN ('in_progress', 'sent', 'rejected', 'completed')
UNION ALL
SELECT 'Total reportes actualizados a sent:', COUNT(*) 
FROM ifta_quarterly_reports 
WHERE status = 'sent';

-- Actualizar el comentario de la columna
COMMENT ON COLUMN ifta_quarterly_reports.status IS 'Estado del reporte: in_progress, sent, rejected, completed';
