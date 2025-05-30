import React, { useState } from 'react';
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
  TableSortLabel
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  AddTwoTone as AddTwoTone,
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Sample data
const sampleData = [
  {
    id: 1,
    date: '2023-05-01',
    unitNumber: 'TRK-001',
    milesTraveled: 1250,
    totalGallons: 250.5,
    status: 'Completed',
    receiptId: 'rec123',
    state: 'CA',
    mpg: 5.0,
    taxPaid: 125.25
  },
  {
    id: 2,
    date: '2023-05-15',
    unitNumber: 'TRK-002',
    milesTraveled: 980,
    totalGallons: 196.0,
    status: 'Pending',
    receiptId: 'rec124',
    state: 'TX',
    mpg: 5.0,
    taxPaid: 98.00
  },
  {
    id: 3,
    date: '2023-06-01',
    unitNumber: 'TRK-001',
    milesTraveled: 1100,
    totalGallons: 220.0,
    status: 'Completed',
    receiptId: 'rec125',
    state: 'AZ',
    mpg: 5.0,
    taxPaid: 110.00
  },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateString) => {
  return format(new Date(dateString), 'MM/dd/yyyy');
};

const statusFilters = ['All', 'Completed', 'Pending', 'Rejected'];

const ConsumptionHistory = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewReceipt = (receiptId) => {
    console.log('View receipt:', receiptId);
  };

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
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={2}>
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Unit #</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell align="right">Miles Traveled</TableCell>
                  <TableCell align="right">Total Gallons</TableCell>
                  <TableCell align="right">MPG</TableCell>
                  <TableCell align="right">Tax Paid</TableCell>
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
                      <TableCell>{row.state}</TableCell>
                      <TableCell align="right">{row.milesTraveled.toLocaleString()}</TableCell>
                      <TableCell align="right">{row.totalGallons.toFixed(2)}</TableCell>
                      <TableCell align="right">{row.mpg}</TableCell>
                      <TableCell align="right">{formatCurrency(row.taxPaid)}</TableCell>
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
                          onClick={() => handleViewReceipt(row.receiptId)}
                          size="small"
                          sx={{ color: 'primary.main' }}
                        >
                          <ReceiptIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)' }}
          />
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default ConsumptionHistory;
