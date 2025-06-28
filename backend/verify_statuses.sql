-- Verificar la distribución actual de estados
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ifta_quarterly_reports), 2) as percentage
FROM ifta_quarterly_reports 
GROUP BY status
ORDER BY count DESC;
