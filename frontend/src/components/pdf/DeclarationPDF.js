import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font,
  Image
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import logo from '../../assets/img/dtp-logo.png';

// Registrar fuentes
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
  fontStyle: 'normal',
  fontWeight: 'normal',
});

// Mapeo de códigos de estado a nombres completos
const STATE_NAMES = {
  'AL': 'ALABAMA', 'AK': 'ALASKA', 'AZ': 'ARIZONA', 'AR': 'ARKANSAS',
  'CA': 'CALIFORNIA', 'CO': 'COLORADO', 'CT': 'CONNECTICUT', 'DE': 'DELAWARE',
  'FL': 'FLORIDA', 'GA': 'GEORGIA', 'HI': 'HAWAII', 'ID': 'IDAHO',
  'IL': 'ILLINOIS', 'IN': 'INDIANA', 'IA': 'IOWA', 'KS': 'KANSAS',
  'KY': 'KENTUCKY', 'LA': 'LOUISIANA', 'ME': 'MAINE', 'MD': 'MARYLAND',
  'MA': 'MASSACHUSETTS', 'MI': 'MICHIGAN', 'MN': 'MINNESOTA',
  'MS': 'MISSISSIPPI', 'MO': 'MISSOURI', 'MT': 'MONTANA',
  'NE': 'NEBRASKA', 'NV': 'NEVADA', 'NH': 'NEW HAMPSHIRE',
  'NJ': 'NEW JERSEY', 'NM': 'NEW MEXICO', 'NY': 'NEW YORK',
  'NC': 'NORTH CAROLINA', 'ND': 'NORTH DAKOTA', 'OH': 'OHIO',
  'OK': 'OKLAHOMA', 'OR': 'OREGON', 'PA': 'PENNSYLVANIA',
  'RI': 'RHODE ISLAND', 'SC': 'SOUTH CAROLINA', 'SD': 'SOUTH DAKOTA',
  'TN': 'TENNESSEE', 'TX': 'TEXAS', 'UT': 'UTAH', 'VT': 'VERMONT',
  'VA': 'VIRGINIA', 'WA': 'WASHINGTON', 'WV': 'WEST VIRGINIA',
  'WI': 'WISCONSIN', 'WY': 'WYOMING', 'DC': 'DISTRICT OF COLUMBIA',
  'PR': 'PUERTO RICO', 'GU': 'GUAM', 'VI': 'VIRGIN ISLANDS',
  'AA': 'ARMED FORCES AMERICAS', 'AE': 'ARMED FORCES EUROPE',
  'AP': 'ARMED FORCES PACIFIC', 'FM': 'FEDERATED STATES OF MICRONESIA',
  'MH': 'MARSHALL ISLANDS', 'MP': 'NORTHERN MARIANA ISLANDS',
  'PW': 'PALAU', 'AS': 'AMERICAN SAMOA'
};

// Estilos
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: 10,
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: 'contain',
    marginRight: 20,
  },
  companyInfo: {
    flex: 1,
    marginLeft: 20,
    textAlign: 'right',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  table: {
    width: '100%',
    border: '1px solid #000',
    marginTop: 20,
    borderCollapse: 'collapse',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    borderBottom: '2px solid #000',
  },
  tableCell: {
    padding: '5px 8px',
    borderRight: '1px solid #000',
    fontSize: 9,
    textAlign: 'left',
  },
  cellRight: {
    textAlign: 'right',
  },
  cellCenter: {
    textAlign: 'center',
  },
  // Column widths
  colUnit: { width: '15%' },
  colState: { width: '50%' },
  colMiles: { width: '17.5%' },
  colGallons: { width: '17.5%' },
  textRight: {
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    borderTop: '1px solid #e0e0e0',
    paddingTop: 10,
  },
});

const DeclarationPDF = ({ 
  companyName = 'DTP LOGISTICS', 
  reportDate = new Date(), 
  unitNumber = 'N/A',
  quarter,
  year,
  vehicleStateData = { vehicles: [], months: [], quarters: [] },
  logoUrl = logo // Usamos la importación directa del logo
}) => {
  // Obtener meses únicos del trimestre
  const quarterMonths = vehicleStateData.months || [];
  const quarterName = `Q${quarter} ${year}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado con logo e información de la empresa */}
        <View style={styles.header}>
          <Image 
            src={logoUrl} 
            style={styles.logo}
          />
          <View style={styles.companyInfo}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 3 }}>{companyName}</Text>
            <Text style={{ fontSize: 10, marginBottom: 2 }}>IFTA QUARTERLY TAX RETURN</Text>
            <Text style={{ fontSize: 10, marginBottom: 2 }}>FOR QUARTER ENDING: {quarterName}</Text>
            <Text style={{ fontSize: 10, marginBottom: 2 }}>UNIT #: {unitNumber}</Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 3 }}>Generated on: {format(new Date(reportDate), "MMM d, yyyy 'at' h:mma", { locale: enUS }).toLowerCase()}</Text>
          </View>
        </View>

        {/* Report title */}
        <View style={{ marginVertical: 15, textAlign: 'center' }}>
          <Text style={styles.title}>TRIP AND FUEL SUMMARY</Text>
          <Text style={styles.subtitle}>FOR IFTA QUARTERLY TAX RETURN - {quarterName}</Text>
        </View>

        {/* Main Data Table */}
        <View style={{ marginTop: 10 }}>
          <View style={[styles.table, { width: '100%' }]}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.colUnit, styles.cellCenter]}>UNIT #</Text>
              <Text style={[styles.tableCell, styles.colState, styles.cellCenter]}>STATE</Text>
              <Text style={[styles.tableCell, styles.colMiles, styles.cellCenter]}>TOTAL MILES</Text>
              <Text style={[styles.tableCell, styles.colGallons, styles.cellCenter]}>TOTAL GALLONS</Text>
            </View>

            {/* Table Rows */}
            {(() => {
              // Create a map to store data by month and state
              const monthMap = new Map();
              
              // Process all vehicles and their states
              vehicleStateData.vehicles.forEach(vehicle => {
                if (!vehicle.states) return;
                
                vehicle.states.forEach(state => {
                  if (!state || !state.months) return;
                  
                  // Process each month's data for this state
                  Array.from(state.months.entries()).forEach(([month, monthData]) => {
                    // Initialize month entry if it doesn't exist
                    if (!monthMap.has(month)) {
                      monthMap.set(month, new Map());
                    }
                    
                    const stateMonthMap = monthMap.get(month);
                    
                    // Initialize state entry for this month if it doesn't exist
                    if (!stateMonthMap.has(state.code)) {
                      stateMonthMap.set(state.code, {
                        name: STATE_NAMES[state.code] || state.code,
                        miles: 0,
                        gallons: 0
                      });
                    }
                    
                    // Add the data for this vehicle/state/month
                    const stateEntry = stateMonthMap.get(state.code);
                    stateEntry.miles += parseFloat(monthData.miles || 0);
                    stateEntry.gallons += parseFloat(monthData.gallons || 0);
                  });
                });
              });
              
              // Sort months in chronological order
              const sortedMonths = Array.from(monthMap.entries())
                .sort(([monthA], [monthB]) => new Date(monthA) - new Date(monthB));
              
              // Calculate grand totals
              let grandTotalMiles = 0;
              let grandTotalGallons = 0;
              
              return (
                <>
                  {sortedMonths.map(([month, stateDataMap]) => {
                    // Convert state data to array and sort by state name
                    const sortedStates = Array.from(stateDataMap.entries())
                      .map(([code, data]) => ({
                        code,
                        ...data
                      }))
                      .sort((a, b) => a.name.localeCompare(b.name));
                    
                    // Calculate monthly totals
                    const monthMiles = sortedStates.reduce((sum, state) => sum + state.miles, 0);
                    const monthGallons = sortedStates.reduce((sum, state) => sum + state.gallons, 0);
                    
                    // Add to grand totals
                    grandTotalMiles += monthMiles;
                    grandTotalGallons += monthGallons;
                    
                    // Format month name
                    const monthName = format(new Date(month), 'MMMM yyyy', { locale: enUS });
                    
                    return (
                      <React.Fragment key={month}>
                        {/* Month Header */}
                        <View style={[styles.tableRow, { backgroundColor: '#e9ecef' }]}>
                          <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', fontWeight: 'bold' }]}>
                            {monthName.toUpperCase()}
                          </Text>
                        </View>
                        
                        {/* States for this month */}
                        {sortedStates.map((state, index) => (
                          <View key={`${month}-${state.code}-${index}`} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colUnit, styles.cellCenter]}>{unitNumber}</Text>
                            <Text style={[styles.tableCell, styles.colState]}>{state.name}</Text>
                            <Text style={[styles.tableCell, styles.colMiles, styles.cellRight]}>{formatNumber(state.miles)}</Text>
                            <Text style={[styles.tableCell, styles.colGallons, styles.cellRight]}>{formatNumber(state.gallons, 1)}</Text>
                          </View>
                        ))}
                        
                        {/* Monthly Total */}
                        <View style={[styles.tableRow, { backgroundColor: '#f8f9fa' }]}>
                          <Text style={[styles.tableCell, styles.colUnit, styles.cellCenter, { fontWeight: 'bold' }]}>
                            TOTAL
                          </Text>
                          <Text style={[styles.tableCell, styles.colState, { fontWeight: 'bold' }]}>
                            {`${monthName.toUpperCase()} TOTAL`}
                          </Text>
                          <Text style={[styles.tableCell, styles.colMiles, styles.cellRight, { fontWeight: 'bold' }]}>
                            {formatNumber(monthMiles)}
                          </Text>
                          <Text style={[styles.tableCell, styles.colGallons, styles.cellRight, { fontWeight: 'bold' }]}>
                            {formatNumber(monthGallons, 1)}
                          </Text>
                        </View>
                        
                        {/* Empty row for spacing */}
                        <View style={{ height: 10 }}></View>
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Grand Total Row */}
                  {sortedMonths.length > 0 && (
                    <View style={[styles.tableRow, { backgroundColor: '#e9ecef' }]}>
                      <Text style={[styles.tableCell, styles.colUnit, styles.cellCenter, { fontWeight: 'bold' }]}>TOTAL</Text>
                      <Text style={[styles.tableCell, styles.colState, { fontWeight: 'bold' }]}>ALL MONTHS - ALL STATES</Text>
                      <Text style={[styles.tableCell, styles.colMiles, styles.cellRight, { fontWeight: 'bold' }]}>
                        {formatNumber(grandTotalMiles)}
                      </Text>
                      <Text style={[styles.tableCell, styles.colGallons, styles.cellRight, { fontWeight: 'bold' }]}>
                        {formatNumber(grandTotalGallons, 1)}
                      </Text>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        </View>

        {/* Quarter Information */}
        <View style={{ marginTop: 20, border: '1px solid #000', padding: 10 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>QUARTERLY SUMMARY:</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 10, marginBottom: 3 }}>UNIT #: {unitNumber}</Text>
              <Text style={{ fontSize: 10 }}>QUARTER: {quarterName}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, marginBottom: 3, textAlign: 'right' }}>
                TOTAL STATES: {new Set(vehicleStateData.vehicles.flatMap(v => 
                  v.states?.map(s => s.code) || []
                )).size}
              </Text>
              <Text style={{ fontSize: 10, textAlign: 'right' }}>
                REPORT GENERATED: {format(new Date(), "MMM d, yyyy 'at' h:mma")}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Document generated on {format(new Date(), "MMM d, yyyy 'at' h:mm a", { locale: enUS })}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Función auxiliar para formatear números
const formatNumber = (num, maxDecimals = 2) => {
  if (num === null || num === undefined) return '0';
  
  // Convertir a número si es un string
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  // Formatear con separadores de miles y hasta 2 decimales sin redondear
  const parts = number.toString().split('.');
  let formatted = '';
  
  // Agregar separadores de miles a la parte entera
  formatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Manejar la parte decimal si existe
  if (parts[1] !== undefined) {
    // Tomar hasta maxDecimals dígitos sin redondear
    const decimalPart = parts[1].substring(0, maxDecimals);
    // Eliminar ceros innecesarios al final
    const trimmedDecimal = decimalPart.replace(/0+$/, '');
    if (trimmedDecimal) {
      formatted += '.' + trimmedDecimal;
    } else if (maxDecimals > 0) {
      // Si se requieren decimales pero son todos ceros, mostrar .00
      formatted += '.' + '0'.repeat(maxDecimals);
    }
  } else if (maxDecimals > 0) {
    // Si no hay decimales pero se requieren, agregar .00
    formatted += '.' + '0'.repeat(maxDecimals);
  }
  
  return formatted;
};

// Función auxiliar para convertir códigos de estado a nombres
const stateCodeToName = (code, full = false) => {
  const states = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire',
    'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina',
    'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania',
    'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee',
    'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
    'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
    'PR': 'Puerto Rico', 'GU': 'Guam', 'VI': 'Virgin Islands', 'MP': 'Northern Mariana Islands',
    'AS': 'American Samoa'
  };
  
  if (code === 'TOTAL') return 'TOTAL';
  return full ? `${code} - ${states[code] || code}` : (states[code] || code);
};

export default DeclarationPDF;
