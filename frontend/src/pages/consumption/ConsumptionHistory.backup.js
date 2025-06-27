import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getConsumptionReports } from '../../../services/consumptionService';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Button,
  TextField,
  Grid,
  Stack,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Collapse,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Status mapping for display
const statusMap = {
  'draft': { label: 'Borrador', color: 'default' },
  'submitted': { label: 'Enviado', color: 'primary' },
  'approved': { label: 'Aprobado', color: 'success' },
  'rejected': { label: 'Rechazado', color: 'error' }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateString) => {
  try {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const day = date.getDate();
    const month = date.toLocaleString('es-ES', { month: 'short' });
    const year = date.getFullYear();
    
    return `${day} ${month}. ${year}`;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha inválida';
  }
};

const getQuarter = (dateString) => {
  try {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Q? ????'; // Retornar marcador de posición si la fecha no es válida
    
    const month = date.getMonth() + 1; // getMonth() comienza en 0 (enero = 0)
    const year = date.getFullYear();
    const quarter = Math.ceil(month / 3);
    
    return `Q${quarter} ${year}`;
  } catch (error) {
    console.error('Error obteniendo trimestre:', error);
    return 'Q? ????'; // Retornar marcador de posición si hay un error
  }
};

const statusFilters = ['all', 'draft', 'submitted', 'approved', 'rejected'];

// Componente para mostrar una fila en vista móvil
const MobileTableRow = ({ row, onViewReceipt }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card sx={{ mb: 2, width: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1">{row.unitNumber}</Typography>
            <Typography variant="body2" color="textSecondary">
              {formatDate(row.date)}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Chip
              label={row.status}
              color={
                row.status === 'Paid' ? 'success' :
                row.status === 'Pending' ? 'warning' : 'default'
              }
              size="small"
              sx={{ minWidth: 80, borderRadius: 1 }}
            />
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ ml: 1 }}
            >
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                }}
              />
            </IconButton>
          </Box>
        </Box>
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Quarter</Typography>
                <Typography variant="body1">{getQuarter(row.date)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Miles</Typography>
                <Typography variant="body1">{row.milesTraveled.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Gallons</Typography>
                <Typography variant="body1">{row.totalGallons.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">MPG</Typography>
                <Typography variant="body1">{row.mpg}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ReceiptIcon />}
                  onClick={() => onViewReceipt(row.id)}
                  fullWidth
                >
                  Ver Detalles
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const ConsumptionHistory = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for reports and loading
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  
  // Fetch reports from API
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        sort: orderBy,
        order: order
      };
      
      const data = await getConsumptionReports(filters);
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchReports();
  }, [page, rowsPerPage, statusFilter, searchTerm, orderBy, order]);
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle sorting
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Handle view report
  const handleViewReport = (reportId) => {
    navigate(`/consumption/${reportId}`);
  };
  
  // Handle create new report
  const handleCreateNew = () => {
    navigate('/consumption/new');
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchReports();
  };
  
  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  

const statusFilters = ['all', 'draft', 'submitted', 'approved', 'rejected'];

// Componente para mostrar una fila en vista móvil
const MobileTableRow = ({ row, onViewReceipt }) => {
const [expanded, setExpanded] = useState(false);
  
return (
<Card sx={{ mb: 2, width: '100%' }}>
<CardContent>
<Box display="flex" justifyContent="space-between" alignItems="center">
<Box>
<Typography variant="subtitle1">{row.unitNumber}</Typography>
<Typography variant="body2" color="textSecondary">
{formatDate(row.date)}
</Typography>
</Box>
<Box textAlign="right">
<Chip
label={row.status}
color={
row.status === 'Paid' ? 'success' :
row.status === 'Pending' ? 'warning' : 'default'
}
size="small"
sx={{ minWidth: 80, borderRadius: 1 }}
/>
<IconButton
size="small"
onClick={() => setExpanded(!expanded)}
sx={{ ml: 1 }}
>
<ExpandMoreIcon
sx={{
transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
transition: 'transform 0.3s',
}
}
/>
</IconButton>
</Box>
</Box>
  
<Collapse in={expanded} timeout="auto" unmountOnExit>
<Box mt={2}>
<Grid container spacing={2}>
<Grid item xs={6}>
<Typography variant="body2" color="textSecondary">Quarter</Typography>
<Typography variant="body1">{getQuarter(row.date)}</Typography>
</Grid>
<Grid item xs={6}>
<Typography variant="body2" color="textSecondary">Miles</Typography>
<Typography variant="body1">{row.milesTraveled.toLocaleString()}</Typography>
</Grid>
<Grid item xs={6}>
<Typography variant="body2" color="textSecondary">Gallons</Typography>
<Typography variant="body1">{row.totalGallons.toFixed(2)}</Typography>
</Grid>
<Grid item xs={6}>
<Typography variant="body2" color="textSecondary">MPG</Typography>
<Typography variant="body1">{row.mpg}</Typography>
</Grid>
<Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
<Button
variant="outlined"
size="small"
startIcon={<ReceiptIcon />}
onClick={() => onViewReceipt(row.id)}
fullWidth
>
Ver Detalles
</Button>
</Grid>
</Grid>
</Box>
</Collapse>
</CardContent>
</Card>
);
};

const ConsumptionHistory = () => {
const { currentUser } = useAuth();
const navigate = useNavigate();
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
// State for reports and loading
const [reports, setReports] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
  
// Pagination and filtering
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);
const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState('all');
const [orderBy, setOrderBy] = useState('created_at');
const [order, setOrder] = useState('desc');
const [startDate, setStartDate] = useState(null);
const [endDate, setEndDate] = useState(null);

// Fetch reports from API
const fetchReports = async () => {
try {
setLoading(true);
setError(null);
  
const filters = {
page: page + 1,
limit: rowsPerPage,
status: statusFilter !== 'all' ? statusFilter : undefined,
search: searchTerm || undefined,
sort: orderBy,
order: order
};
  
const data = await getConsumptionReports(filters);
setReports(data);
} catch (err) {
console.error('Error fetching reports:', err);
setError(err.message || 'Error al cargar los reportes');
} finally {
setLoading(false);
}
};
  
// Initial data fetch
useEffect(() => {
fetchReports();
}, [page, rowsPerPage, statusFilter, searchTerm, orderBy, order]);
  
// Handle pagination
const handleChangePage = (event, newPage) => {
setPage(newPage);
};
  
const handleChangeRowsPerPage = (event) => {
setRowsPerPage(parseInt(event.target.value, 10));
setPage(0);
};
  
// Handle sorting
const handleRequestSort = (property) => {
const isAsc = orderBy === property && order === 'asc';
setOrder(isAsc ? 'desc' : 'asc');
setOrderBy(property);
};
  
// Handle view report
const handleViewReport = (reportId) => {
navigate(`/consumption/${reportId}`);
};
  
// Handle create new report
const handleCreateNew = () => {
navigate('/consumption/new');
};
  
// Handle refresh
const handleRefresh = () => {
fetchReports();
};
  
// Handle search
const handleSearch = (event) => {
setSearchTerm(event.target.value);
setPage(0);
};
  
// Handle status filter change
const handleStatusFilterChange = (newStatus) => {
setStatusFilter(newStatus);
setPage(0);
};
  
const handleViewReceipt = (id) => {
navigate(`/consumption/${id}`);
};
  
const filteredData = sampleData.filter((row) => {
const matchesSearch = row.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
  
// Add date range filtering logic here if needed
return matchesSearch && matchesStatus;
});
  
return (
<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
<Container maxWidth={false} disableGutters sx={{ p: 0 }}>
{/* Header Section */}
<Box sx={{
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
p: 3,
backgroundColor: 'background.paper',
boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
mb: 2
}}>
<Typography variant="h5" component="h1" fontWeight="bold">
Consumption History
</Typography>
<Button
variant="contained"
color="primary"
startIcon={<AddTwoTone />}
onClick={() => navigate('/consumption/create')}
sx={{ textTransform: 'none' }}
>
Add Consumption Record
</Button>
</Box>

{/* Filters Section */}
<Container maxWidth="xl" sx={{ px: 3, mb: 3 }}>
<Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
<Grid container spacing={2} alignItems="center">
<Grid item xs={12} md={12}>
<Stack direction="row" spacing={1} sx={{ flexWrap: 'nowrap', gap: 1, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: '6px' } }}>
{statusFilters.map((filter) => (
<Button
key={filter}
variant={statusFilter === filter ? 'contained' : 'outlined'}
color="primary"
size="small"
onClick={() => {
setStatusFilter(filter);
setPage(0); // Reset to first page when changing status
}}
sx={{
textTransform: 'none',
borderRadius: 2,
minWidth: 'auto',
whiteSpace: 'nowrap',
px: 2,
...(statusFilter === filter && {
bgcolor: 'primary.main',
color: 'white',
'&:hover': {
bgcolor: 'primary.dark',
},
}),
}
}
>
{filter}
</Button>
))}
</Stack>
</Grid>
<Grid item xs={6} md={3}>
<TextField
fullWidth
variant="outlined"
size="small"
placeholder="Search by unit #"
value={searchTerm}
onChange={(e) => {
setSearchTerm(e.target.value);
setPage(0); // Reset to first page when searching
}}
InputProps={{
startAdornment: (
<InputAdornment position="start">
<SearchIcon color="action" />
</InputAdornment>
),
}}
/>
</Grid>
<Grid item xs={12} md={3}>
<DatePicker
label="Start Date"
value={startDate}
onChange={(newValue) => setStartDate(newValue)}
renderInput={(params) => <TextField {...params} fullWidth size="small" />}
/>
</Grid>
<Grid item xs={12} md={3}>
<DatePicker
label="End Date"
value={endDate}
onChange={(newValue) => setEndDate(newValue)}
renderInput={(params) => <TextField {...params} fullWidth size="small" />}
/>
</Grid>
<Grid item xs={6} md={2}>
<Button
variant="outlined"
fullWidth
startIcon={<FilterListIcon />}
sx={{ height: '40px' }}
>
Filter
</Button>
</Grid>
</Grid>
</Paper>
</Container>
  const filteredData = sampleData.filter((row) => {
    const matchesSearch = row.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || row.status === statusFilter;

    // Add date range filtering logic here if needed
    return matchesSearch && matchesStatus;
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth={false} disableGutters sx={{ p: 0 }}>
        {/* Header Section */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          backgroundColor: 'background.paper',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          mb: 2
        }}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Consumption History
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddTwoTone />}
            onClick={() => navigate('/consumption/create')}
            sx={{ textTransform: 'none' }}
          >
            Add Consumption Record
          </Button>
        </Box>

        {/* Filters Section */}
        <Container maxWidth="xl" sx={{ px: 3, mb: 3 }}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={12}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'nowrap', gap: 1, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: '6px' } }}>
                  {statusFilters.map((filter) => (
                    <Button
                      key={filter}
                      variant={statusFilter === filter ? 'contained' : 'outlined'}
                      color="primary"
                      size="small"
                      onClick={() => {
                        setStatusFilter(filter);
                        setPage(0); // Reset to first page when changing status
                      }}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        px: 2,
                        ...(statusFilter === filter && {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        }),
                      }}
                    >
                      {filter}
                    </Button>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Search by unit #"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0); // Reset to first page when searching
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<FilterListIcon />}
                  sx={{ height: '40px' }}
                >
                  Filter
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Container>


        {/* Table Section */}
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {isMobile ? (
            // Vista móvil - Tarjetas
            <Box sx={{ p: 2 }}>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <MobileTableRow 
                    key={row.id} 
                    row={row} 
                    onViewReceipt={handleViewReceipt} 
                  />
                ))}
            </Box>
          ) : (
            // Vista escritorio - Tabla
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Date</TableCell>
                    <TableCell>Unit #</TableCell>
                    <TableCell>Quarter</TableCell>
                    <TableCell align="right">Miles Traveled</TableCell>
                    <TableCell align="right">Total Gallons</TableCell>
                    <TableCell align="right">MPG</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{formatDate(row.date)}</TableCell>
                        <TableCell>{row.unitNumber}</TableCell>
                        <TableCell>{getQuarter(row.date)}</TableCell>
                        <TableCell align="right">{row.milesTraveled.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.totalGallons.toFixed(2)}</TableCell>
                        <TableCell align="right">{row.mpg}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            color={
                              row.status === 'Paid' ? 'success' :
                                row.status === 'Pending' ? 'warning' : 'default'
                            }
                            size="small"
                            sx={{ minWidth: 80, borderRadius: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleViewReceipt(row.id)}
                            size="small"
                            sx={{ color: 'primary.main' }}
                            aria-label="Ver detalles"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ 
              borderTop: '1px solid rgba(224, 224, 224, 1)',
              '& .MuiTablePagination-toolbar': {
                flexWrap: 'wrap',
                justifyContent: 'center'
              }
            }}
          />
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default ConsumptionHistory;
