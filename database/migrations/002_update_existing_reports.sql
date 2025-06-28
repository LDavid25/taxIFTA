-- Actualizar reportes existentes al nuevo estado por defecto 'in_progress'
-- Solo actualiza los reportes que no tienen un estado válido en el nuevo esquema
UPDATE ifta_quarterly_reports 
SET status = 'in_progress' 
WHERE status NOT IN ('in_progress', 'sent', 'rejected', 'completed');

-- Actualizar los estados antiguos a los nuevos valores equivalentes
UPDATE ifta_quarterly_reports 
SET status = 'sent'
WHERE status IN ('submitted', 'in_review', 'approved');

-- Verificar que no queden estados inválidos
-- Esta consulta debería devolver 0 filas si todo está correcto
SELECT id, status 
FROM ifta_quarterly_reports 
WHERE status NOT IN ('in_progress', 'sent', 'rejected', 'completed');

COMMENT ON COLUMN ifta_quarterly_reports.status IS 'Estado del reporte: in_progress, sent, rejected, completed';
