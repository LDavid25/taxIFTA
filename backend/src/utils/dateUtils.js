/**
 * Obtiene el trimestre anterior al proporcionado
 * @param {number} currentQuarter - Trimestre actual (1-4)
 * @param {number} currentYear - Año actual
 * @returns {Object} Objeto con quarter y year del trimestre anterior
 */
function getPreviousQuarter(currentQuarter, currentYear) {
  let previousQuarter = currentQuarter - 1;
  let previousYear = currentYear;
  
  if (previousQuarter < 1) {
    previousQuarter = 4;
    previousYear--;
  }
  
  return { quarter: previousQuarter, year: previousYear };
}

/**
 * Obtiene el rango de fechas para un trimestre específico
 * @param {number} quarter - Trimestre (1-4)
 * @param {number} year - Año
 * @returns {Object} Objeto con startDate y endDate
 */
function getQuarterDateRange(quarter, year) {
  let startMonth, endMonth, endDay;
  
  switch(quarter) {
    case 1: // Q1: Ene 1 - Mar 31
      startMonth = 0;  // Enero (0-indexed)
      endMonth = 2;    // Marzo (0-indexed)
      endDay = 31;
      break;
    case 2: // Q2: Abr 1 - Jun 30
      startMonth = 3;  // Abril
      endMonth = 5;    // Junio
      endDay = 30;
      break;
    case 3: // Q3: Jul 1 - Sep 30
      startMonth = 6;  // Julio
      endMonth = 8;    // Septiembre
      endDay = 30;
      break;
    case 4: // Q4: Oct 1 - Dic 31
      startMonth = 9;  // Octubre
      endMonth = 11;   // Diciembre
      endDay = 31;
      break;
    default:
      throw new Error('Trimestre no válido. Debe ser un número entre 1 y 4.');
  }
  
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth, endDay);
  
  return { startDate, endDate };
}

module.exports = {
  getPreviousQuarter,
  getQuarterDateRange
};
