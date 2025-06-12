import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Grid,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Print as PrintIcon, 
  Send as SendIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  PictureAsPdf as PictureAsPdfIcon
} from '@mui/icons-material';
import AlertMessage from '../../components/common/AlertMessage';
import LoadingScreen from '../../components/common/LoadingScreen';
import { getDeclarationById } from '../../services/declarationService';

const DeclarationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [declaration, setDeclaration] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [status, setStatus] = useState('');
  const [selectedStartQuarter, setSelectedStartQuarter] = useState('1');
  const [selectedEndQuarter, setSelectedEndQuarter] = useState('4');
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedStartYear, setSelectedStartYear] = useState('');
  const [selectedEndYear, setSelectedEndYear] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');

  // Obtener lista de años disponibles
  useEffect(() => {
    if (!declaration) return;

    const years = new Set();
    declaration.trips.forEach(trip => {
      const date = new Date(trip.trip_date);
      years.add(date.getFullYear());
    });

    const sortedYears = Array.from(years).sort();
    setAvailableYears(sortedYears);

    // Establecer años predeterminados (más antiguo y más reciente)
    if (sortedYears.length > 0) {
      setSelectedStartYear(sortedYears[0].toString());
      setSelectedEndYear(sortedYears[sortedYears.length - 1].toString());
    }
  }, [declaration]);

  // Calcular resumen mensual
  useEffect(() => {
    if (!declaration || !selectedStartYear || !selectedEndYear) return;

    const tripsByMonth = {};

    declaration.trips.forEach(trip => {
      const date = new Date(trip.trip_date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const quarter = Math.ceil(month / 3);

      // Filtrar por rango de años
      if (year < parseInt(selectedStartYear) || year > parseInt(selectedEndYear)) return;

      // Filtrar por trimestres seleccionados
      if (year === parseInt(selectedStartYear) && year === parseInt(selectedEndYear)) {
        // Mismo año, verificar rango de trimestres
        if (quarter < parseInt(selectedStartQuarter) || quarter > parseInt(selectedEndQuarter)) return;
      } else if (year === parseInt(selectedStartYear)) {
        // Año inicial, verificar solo trimestre mínimo
        if (quarter < parseInt(selectedStartQuarter)) return;
      } else if (year === parseInt(selectedEndYear)) {
        // Final year, check only maximum quarter
        if (quarter > parseInt(selectedEndQuarter)) return;
      }

      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;

      if (!tripsByMonth[monthKey]) {
        tripsByMonth[monthKey] = {
          month: month,
          year: year,
          quarter: quarter,
          monthName: date.toLocaleString('default', { month: 'long' }),
          totalMiles: 0,
          totalGallons: 0
        };
      }

      tripsByMonth[monthKey].totalMiles += trip.distance;
      tripsByMonth[monthKey].totalGallons += trip.fuel_consumed;
    });

    setMonthlySummary(Object.values(tripsByMonth));
  }, [declaration, selectedStartYear, selectedEndYear, selectedStartQuarter, selectedEndQuarter]);

  // Filtrar viajes por rango de fechas seleccionado
  const filteredTrips = declaration?.trips.filter(trip => {
    if (!selectedStartYear || !selectedEndYear) return false;

    const date = new Date(trip.trip_date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const quarter = Math.ceil(month / 3);

    // Filtrar por rango de años
    if (year < parseInt(selectedStartYear) || year > parseInt(selectedEndYear)) return false;

    // Filtrar por trimestres seleccionados
    if (year === parseInt(selectedStartYear) && year === parseInt(selectedEndYear)) {
      // Mismo año, verificar rango de trimestres
      if (quarter < parseInt(selectedStartQuarter) || quarter > parseInt(selectedEndQuarter)) return false;
    } else if (year === parseInt(selectedStartYear)) {
      // Año inicial, verificar solo trimestre mínimo
      if (quarter < parseInt(selectedStartQuarter)) return false;
    } else if (year === parseInt(selectedEndYear)) {
      // Año final, verificar solo trimestre máximo
      if (quarter > parseInt(selectedEndQuarter)) return false;
    }

    return true;
  }) || [];

  // Obtener trimestre de un mes
  const getQuarter = (month) => {
    return Math.ceil(month / 3);
  };

  // Obtener rango de meses de un trimestre
  const getQuarterRange = (quarter) => {
    const months = [
      'Enero - Marzo',
      'Abril - Junio',
      'Julio - Septiembre',
      'Octubre - Diciembre'
    ];
    return months[quarter - 1] || '';
  };

  // Map state codes to full names
  const stateCodeToName = (code) => {
    const states = {
      'AL': 'Alabama',
      'AK': 'Alaska',
      'AZ': 'Arizona',
      'AR': 'Arkansas',
      'CA': 'California',
      'CO': 'Colorado',
      'CT': 'Connecticut',
      'DE': 'Delaware',
      'FL': 'Florida',
      'GA': 'Georgia',
      'HI': 'Hawaii',
      'ID': 'Idaho',
      'IL': 'Illinois',
      'IN': 'Indiana',
      'IA': 'Iowa',
      'KS': 'Kansas',
      'KY': 'Kentucky',
      'LA': 'Louisiana',
      'ME': 'Maine',
      'MD': 'Maryland',
      'MA': 'Massachusetts',
      'MI': 'Michigan',
      'MN': 'Minnesota',
      'MS': 'Mississippi',
      'MO': 'Missouri',
      'MT': 'Montana',
      'NE': 'Nebraska',
      'NV': 'Nevada',
      'NH': 'New Hampshire',
      'NJ': 'New Jersey',
      'NM': 'New Mexico',
      'NY': 'New York',
      'NC': 'North Carolina',
      'ND': 'North Dakota',
      'OH': 'Ohio',
      'OK': 'Oklahoma',
      'OR': 'Oregon',
      'PA': 'Pennsylvania',
      'RI': 'Rhode Island',
      'SC': 'South Carolina',
      'SD': 'South Dakota',
      'TN': 'Tennessee',
      'TX': 'Texas',
      'UT': 'Utah',
      'VT': 'Vermont',
      'VA': 'Virginia',
      'WA': 'Washington',
      'WV': 'West Virginia',
      'WI': 'Wisconsin',
      'WY': 'Wyoming'
    };
    return states[code] || code;
  };

  // Cargar datos de la declaración
  useEffect(() => {
    const fetchDeclaration = async () => {
      setLoading(true);
      try {
        // En una implementación real, esto obtendría datos de la API
        // const response = await getDeclarationById(id);
        // setDeclaration(response.data);

        // Simulamos datos para la demostración
        setTimeout(() => {
          const declarationData = {
            id: parseInt(id),
            quarter: 'Q1',
            year: 2025,
            total_miles: 5200,
            total_gallons: 520,
            status: 'approved',
            created_at: '2025-04-15T10:30:00Z',
            updated_at: '2025-04-20T14:45:00Z',
            state_summary: [
              { state: 'TX', miles: 1500, gallons: 150 },
              { state: 'CA', miles: 1200, gallons: 120 },
              { state: 'AZ', miles: 800, gallons: 80 },
              { state: 'NM', miles: 1700, gallons: 170 }
            ],
            trips: [
              { id: 1, trip_date: '2025-01-15', origin_state: 'TX', destination_state: 'CA', distance: 1200, fuel_consumed: 120 },
              { id: 2, trip_date: '2025-02-10', origin_state: 'CA', destination_state: 'AZ', distance: 800, fuel_consumed: 80 },
              { id: 3, trip_date: '2025-03-05', origin_state: 'AZ', destination_state: 'NM', distance: 1700, fuel_consumed: 170 },
              { id: 4, trip_date: '2025-03-20', origin_state: 'NM', destination_state: 'TX', distance: 1500, fuel_consumed: 150 }
            ]
          };
          setDeclaration(declarationData);
          setStatus(declarationData.status);
          setLoading(false);
        }, 1000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || 'Error loading declaration data',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchDeclaration();
  }, [id]);

  // Manejar cierre de la alerta
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Manejar edición de la declaración
  const handleEdit = () => {
    navigate(`/declarations/${id}/edit`);
  };

  // Manejar eliminación de la declaración
  const handleDelete = () => {
    // En una implementación real, esto mostraría un diálogo de confirmación
    // y luego eliminaría la declaración
    setAlert({
      open: true,
      message: 'This functionality will be implemented in the future',
      severity: 'info'
    });
  };

  // Manejar impresión de la declaración
  const handlePrint = () => {
    setAlert({
      open: true,
      message: 'Print functionality in development',
      severity: 'info'
    });
  };

  // Manejar envío de la declaración
  const handleSubmit = () => {
    setAlert({
      open: true,
      message: 'Submission functionality in development',
      severity: 'info'
    });
  };

  // Manejar cambio de estado
  const handleStatusChange = (event) => {
    const newStatus = event.target.value;
    setStatus(newStatus);
    // En una implementación real, aquí se haría una llamada a la API para actualizar el estado
    setDeclaration(prev => ({
      ...prev,
      status: newStatus,
      updated_at: new Date().toISOString()
    }));
  };

  // Obtener color según el estado de la declaración
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'submitted':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtener texto según el estado de la declaración
  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'submitted':
        return 'Submitted';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading declaration data..." />;
  }

  return (
    <Box>
      <AlertMessage
        open={alert.open}
        onClose={handleAlertClose}
        severity={alert.severity}
        message={alert.message}
        autoHideDuration={6000}
      />

      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/dashboard" color="inherit">
          Dashboard
        </Link>
        <Link component={RouterLink} to="/declarations" color="inherit">
          Declarations
        </Link>
        <Typography color="text.primary">Declaration Details</Typography>
      </Breadcrumbs>


      {/* Filter by date range */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Filter by Date Range</Typography>

            {/* Fila de selectores de fecha inicial */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Typography variant="subtitle2">From:</Typography>

              {/* Año inicial */}
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Start Year</InputLabel>
                <Select
                  value={selectedStartYear}
                  onChange={(e) => setSelectedStartYear(e.target.value)}
                  label="Initial Year"
                >
                  {availableYears.map(year => (
                    <MenuItem key={`start-year-${year}`} value={year.toString()}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Trimestre inicial */}
              <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Start Quarter</InputLabel>
                <Select
                  value={selectedStartQuarter}
                  onChange={(e) => setSelectedStartQuarter(e.target.value)}
                  label="Start Quarter"
                >
                  <MenuItem value="1">Q1: Jan - Mar</MenuItem>
                  <MenuItem value="2">Q2: Apr - Jun</MenuItem>
                  <MenuItem value="3">Q3: Jul - Sep</MenuItem>
                  <MenuItem value="4">Q4: Oct - Dec</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Fila de selectores de fecha final */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Typography variant="subtitle2">To:</Typography>

              {/* Año final */}
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel>End Year</InputLabel>
                <Select
                  value={selectedEndYear}
                  onChange={(e) => setSelectedEndYear(e.target.value)}
                  label="End Year"
                >
                  {availableYears
                    .filter(year => year >= parseInt(selectedStartYear || 0))
                    .map(year => (
                      <MenuItem key={`end-year-${year}`} value={year.toString()}>
                        {year}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Trimestre final */}
              <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                <InputLabel>End Quarter</InputLabel>
                <Select
                  value={selectedEndQuarter}
                  onChange={(e) => setSelectedEndQuarter(e.target.value)}
                  label="End Quarter"
                  disabled={!selectedEndYear}
                >
                  {[1, 2, 3, 4]
                    .filter(q => {
                      // If it's the same year as the start, only show quarters >= start quarter
                      if (selectedStartYear === selectedEndYear) {
                        return q >= parseInt(selectedStartQuarter);
                      }
                      return true;
                    })
                    .map(quarter => (
                      <MenuItem key={`end-q${quarter}`} value={quarter.toString()}>
                        Q{quarter}: {getQuarterRange(quarter).split(' - ')[0].slice(0, 3)} - {getQuarterRange(quarter).split(' - ')[1].slice(0, 3)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Chip
                label={`${filteredTrips.length} trips in period`}
                color="primary"
                variant="outlined"
                sx={{ ml: 'auto' }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle1">Supporting Documentation</Typography>
            <input
              accept="application/pdf,image/*"
              style={{ display: 'none' }}
              id="declaration-document-upload"
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSelectedFile(file);
                  // Create preview for images
                  if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFilePreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                  } else if (file.type === 'application/pdf') {
                    setFilePreview('PDF');
                  }
                }
              }}
            />
            <label htmlFor="declaration-document-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadFileIcon />}
                sx={{ mb: 2 }}
              >
                {selectedFile ? 'Change file' : 'Select file'} (PDF or image)
              </Button>
            </label>
            
            {/* File Preview */}
            {selectedFile && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    File: {selectedFile.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview('');
                      // Reset file input
                      document.getElementById('declaration-document-upload').value = '';
                    }}
                    title="Delete file"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                {filePreview === 'PDF' ? (
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <PictureAsPdfIcon color="error" />
                    <Typography>PDF Document</Typography>
                  </Box>
                ) : filePreview ? (
                  <Box 
                    component="img"
                    src={filePreview}
                    alt="Preview"
                    sx={{ 
                      width: '50px',
                      height: '50px',
                      objectFit: 'contain',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}
                  />
                ) : null}
              </Box>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={() => {
                // Handle finalize declaration logic here
                console.log('Finalizing declaration...');
                // Add your finalization logic here
              }}
              fullWidth
            >
              Finalize Declaration
            </Button>
          </Box>
        </CardContent>
      </Card>

      {declaration && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">
              Declaración IFTA: {declaration.quarter} {declaration.year}
            </Typography>
            <Box>
              {declaration.status === 'pending' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  sx={{ mr: 1 }}
                >
                  Submit
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                sx={{ mr: 1 }}
              >
                Print
              </Button>
              {declaration.status === 'pending' && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
              )}
              {declaration.status === 'pending' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Sección izquierda - Resumen por mes */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Summary
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <TableContainer component={Paper} variant="outlined" sx={{ width: '100%' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell align="right">Total Miles</TableCell>
                          <TableCell align="right">Total Gallons</TableCell>
                          <TableCell align="right">MPG</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {monthlySummary.map((monthData, index) => (
                          <TableRow key={index}>
                            <TableCell component="th" scope="row">
                              {`${monthData.monthName} ${monthData.year}`}
                            </TableCell>
                            <TableCell align="right">{monthData.totalMiles.toLocaleString()}</TableCell>
                            <TableCell align="right">{monthData.totalGallons.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              {(monthData.totalMiles / monthData.totalGallons).toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {monthlySummary.length > 0 && (
                          <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {monthlySummary.reduce((sum, m) => sum + m.totalMiles, 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {monthlySummary.reduce((sum, m) => sum + m.totalGallons, 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {(
                                monthlySummary.reduce((sum, m) => sum + m.totalMiles, 0) /
                                monthlySummary.reduce((sum, m) => sum + m.totalGallons, 0)
                              ).toFixed(1)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Sección derecha - Resumen por estado */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">State Distribution</Typography>
                    <Chip
                      label={`Total trips: ${filteredTrips.length}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <TableContainer component={Paper} variant="outlined" sx={{ width: '100%' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>State</TableCell>
                          <TableCell align="right">Miles</TableCell>
                          <TableCell align="right">Gallons</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {declaration.state_summary.map((state) => (
                          <TableRow key={state.state}>
                            <TableCell component="th" scope="row">
                              {`${state.state} - ${stateCodeToName(state.state)}`}
                            </TableCell>
                            <TableCell align="right">{state.miles.toLocaleString()}</TableCell>
                            <TableCell align="right">{state.gallons.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                            Total
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {declaration.state_summary.reduce((sum, state) => sum + state.miles, 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {declaration.state_summary.reduce((sum, state) => sum + state.gallons, 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/declarations')}
            >
              Back to List
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DeclarationDetail;
