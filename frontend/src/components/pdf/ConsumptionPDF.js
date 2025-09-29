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
// Base64 encoded transparent 1x1 pixel as fallback
import logo from '../../assets/img/dtp-logo.png';

// Register fonts
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
  fontStyle: 'normal',
  fontWeight: 'normal',
});

// State code to name mapping
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
  'PR': 'PUERTO RICO', 'GU': 'GUAM', 'VI': 'VIRGIN ISLANDS'
};

// Styles
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
  colState: { width: '50%' },
  colMiles: { width: '25%' },
  colGallons: { width: '25%' },
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
  summarySection: {
    marginTop: 20,
    border: '1px solid #000',
    padding: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  summaryValue: {
    fontSize: 10,
  },
});

const ConsumptionPDF = ({ 
  reportDate = new Date(), 
  unitNumber = 'N/A',
  consumptionDetails = [],
  totalMiles = 0,
  totalGallons = 0,
  notes = '',
  logoUrl = logo,
  companyName = ' '
}) => {
  // Format date for display
  const formattedDate = format(new Date(reportDate), 'MMMM d, yyyy', { locale: enUS });
  const generatedDate = format(new Date(), 'MMMM d, yyyy \'at\' h:mm a', { locale: enUS });


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo and company info */}
        <View style={styles.header}>
          <Image 
            src={logoUrl} 
            style={styles.logo}
          />
          <View style={styles.companyInfo}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 3 }}>IFTA</Text>
            <Text style={{ fontSize: 10, marginBottom: 2 }}>REPORT</Text>
            <Text style={{ fontSize: 10, marginBottom: 2 }}>Company: {companyName}</Text>
            <Text style={{ fontSize: 10, marginBottom: 2 }}>UNIT #: {unitNumber}</Text>
            <Text style={{ fontSize: 8, color: '#666', marginTop: 3 }}>Generated on: {generatedDate}</Text>
          </View>
        </View>

        {/* Report title */}
        <View style={{ marginVertical: 15, textAlign: 'center' }}>
          <Text style={styles.title}>REPORT SUMMARY</Text>
          <Text style={styles.subtitle}>REPORT DATE: {formattedDate.toUpperCase()}</Text>
        </View>

        {/* Main Data Table */}
        <View style={{ marginTop: 10 }}>
          <View style={[styles.table, { width: '100%' }]}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.colState, styles.cellCenter]}>STATE</Text>
              <Text style={[styles.tableCell, styles.colMiles, styles.cellCenter]}>MILES</Text>
              <Text style={[styles.tableCell, styles.colGallons, styles.cellCenter]}>GALLONS</Text>
            </View>

            {/* Table Rows */}
            {consumptionDetails.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colState]}>
                  {STATE_NAMES[item.stateCode] || item.stateName || item.stateCode}
                </Text>
                <Text style={[styles.tableCell, styles.colMiles, styles.cellRight]}>
                  {formatNumber(item.miles, 'miles') + '.00'}
                </Text>
                <Text style={[styles.tableCell, styles.colGallons, styles.cellRight]}>
                  {formatNumber(item.gallons, 'gallons')}
                </Text>
              </View>
            ))}

            {/* Totals Row */}
            <View style={[styles.tableRow, { backgroundColor: '#f0f0f0' }]}>
              <Text style={[styles.tableCell, styles.colState, { fontWeight: 'bold' }]}>
                TOTALS
              </Text>
              <Text style={[styles.tableCell, styles.colMiles, styles.cellRight, { fontWeight: 'bold' }]}>
                {formatNumber(totalMiles, 'miles') + '.00'}
              </Text>
              <Text style={[styles.tableCell, styles.colGallons, styles.cellRight, { fontWeight: 'bold' }]}>
                {formatNumber(totalGallons, 'gallons')}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>SUMMARY</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Miles Traveled:</Text>
            <Text style={styles.summaryValue}>{formatNumber(totalMiles, 'miles') + '.00'} miles</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Gallons Consumed:</Text>
            <Text style={styles.summaryValue}>{formatNumber(totalGallons, 'gallons')} gal</Text>
          </View>
          
          {notes && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ ...styles.summaryLabel, marginBottom: 5 }}>Notes:</Text>
              <Text style={{ fontSize: 10, textAlign: 'justify' }}>{notes}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Document generated on {generatedDate}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Helper function to format numbers
const formatNumber = (num, type = 'miles') => {
  if (num === null || num === undefined) return type === 'miles' ? '0.00' : '0.000';
  
  // Convert to number if it's a string
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  // For miles, return whole number with thousands separator
  if (type === 'miles') {
    return Math.round(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  // For gallons, always show 3 decimal places
  const fixedNumber = number.toFixed(3);
  const [integer, decimal] = fixedNumber.split('.');
  return `${parseInt(integer).toLocaleString()}.${decimal}`;
};

export default ConsumptionPDF;
