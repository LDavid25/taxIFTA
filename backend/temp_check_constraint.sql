-- Primero, deshabilitar temporalmente la restricción de verificación
ALTER TABLE ifta_quarterly_reports 
  DROP CONSTRAINT IF EXISTS check_quarter_report_status;

-- Ahora actualizar los estados
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

-- Volver a crear la restricción con los nuevos valores permitidos
ALTER TABLE ifta_quarterly_reports
  ADD CONSTRAINT check_quarter_report_status 
  CHECK (status IN ('in_progress', 'sent', 'rejected', 'completed'));

-- Actualizar el comentario de la columna
COMMENT ON COLUMN ifta_quarterly_reports.status IS 'Estado del reporte: in_progress, sent, rejected, completed';
