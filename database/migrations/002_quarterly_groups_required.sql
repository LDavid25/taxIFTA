-- Migración para hacer los grupos trimestrales obligatorios
-- Fecha: 2024-05-30

-- 1. Primero, creamos la función para obtener el trimestre a partir del mes
CREATE OR REPLACE FUNCTION get_quarter(month_num INTEGER) 
RETURNS INTEGER AS $$
BEGIN
  RETURN ((month_num - 1) / 3) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Añadimos la columna quarter a ifta_reports para facilitar las consultas
ALTER TABLE ifta_reports 
  ADD COLUMN quarter INTEGER 
  GENERATED ALWAYS AS (get_quarter(report_month)) STORED;

-- 3. Hacemos que el campo quarter sea obligatorio en ifta_report_groups
ALTER TABLE ifta_report_groups 
  ALTER COLUMN quarter SET NOT NULL;

-- 4. Aseguramos que solo haya un grupo por trimestre por compañía
ALTER TABLE ifta_report_groups
  DROP CONSTRAINT IF EXISTS ifta_report_groups_company_id_name_key,
  ADD CONSTRAINT unq_company_quarter_year 
    UNIQUE (company_id, quarter, year);

-- 5. Función para validar que un reporte pertenece al trimestre correcto
CREATE OR REPLACE FUNCTION validate_report_quarter()
RETURNS TRIGGER AS $$
DECLARE
  group_quarter INTEGER;
  report_quarter INTEGER;
BEGIN
  -- Obtenemos el trimestre del grupo
  SELECT quarter INTO group_quarter 
  FROM ifta_report_groups 
  WHERE id = NEW.group_id;
  
  -- Calculamos el trimestre del reporte
  SELECT get_quarter(NEW.report_month) INTO report_quarter;
  
  -- Verificamos que coincidan
  IF group_quarter != report_quarter THEN
    RAISE EXCEPTION 'El mes del reporte no coincide con el trimestre del grupo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Creamos el trigger para validar el trimestre
DROP TRIGGER IF EXISTS validate_report_quarter_trigger ON ifta_report_group_members;

CREATE TRIGGER validate_report_quarter_trigger
BEFORE INSERT OR UPDATE ON ifta_report_group_members
FOR EACH ROW
EXECUTE FUNCTION validate_report_quarter();

-- 7. Índice para mejorar el rendimiento de las búsquedas por trimestre
CREATE INDEX IF NOT EXISTS idx_ifta_reports_quarter 
  ON ifta_reports(company_id, report_year, quarter);

-- 8. Actualizamos los comentarios para documentar los cambios
COMMENT ON TABLE ifta_report_groups IS 'Grupos trimestrales obligatorios para los reportes IFTA. Cada reporte debe pertenecer a un grupo que representa un trimestre del año.';

COMMENT ON COLUMN ifta_report_groups.quarter IS 'Trimestre del año (1-4). 1: Ene-Mar, 2: Abr-Jun, 3: Jul-Sep, 4: Oct-Dic';

-- 9. Función de ayuda para obtener el nombre del trimestre
CREATE OR REPLACE FUNCTION get_quarter_name(quarter_num INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    WHEN quarter_num = 1 THEN 'Q1 (Ene-Mar)'
    WHEN quarter_num = 2 THEN 'Q2 (Abr-Jun)'
    WHEN quarter_num = 3 THEN 'Q3 (Jul-Sep)'
    WHEN quarter_num = 4 THEN 'Q4 (Oct-Dic)'
    ELSE 'Trimestre inválido'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 10. Actualizamos el trigger para mantener actualizado el nombre del grupo
CREATE OR REPLACE FUNCTION update_group_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := get_quarter_name(NEW.quarter) || ' ' || NEW.year::TEXT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_group_name_trigger ON ifta_report_groups;
CREATE TRIGGER update_group_name_trigger
BEFORE INSERT OR UPDATE OF quarter, year ON ifta_report_groups
FOR EACH ROW
EXECUTE FUNCTION update_group_name();

-- 11. Creamos una función para asegurar que los reportes tengan un grupo asignado
CREATE OR REPLACE FUNCTION ensure_report_has_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificamos que el reporte tenga un grupo asignado
  IF NOT EXISTS (
    SELECT 1 
    FROM ifta_report_group_members 
    WHERE report_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Cada reporte debe pertenecer a un grupo trimestral';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Creamos el trigger para validar que los reportes tengan grupo
DROP TRIGGER IF EXISTS ensure_report_has_group_trigger ON ifta_reports;

CREATE CONSTRAINT TRIGGER ensure_report_has_group_trigger
AFTER INSERT OR UPDATE ON ifta_reports
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION ensure_report_has_group();
