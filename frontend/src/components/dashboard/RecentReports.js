import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Chip,
  Box
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const getStatusColor = (status) => {
  switch (status) {
    case 'in_progress':
      return 'primary';
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

const RecentReports = ({ reports = [] }) => {
  const navigate = useNavigate();

  if (reports.length === 0) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          Informes Recientes
        </Typography>
        <Typography>No hay informes recientes</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Informes Recientes</Typography>
        <Button size="small" onClick={() => navigate('/consumption')}>
          Ver todos
        </Button>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Período</TableCell>
              <TableCell>Vehículo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} hover>
                <TableCell>
                  {format(new Date(report.report_year, report.report_month - 1), 'MMM yyyy', { locale: es })}
                </TableCell>
                <TableCell>{report.vehicle_plate}</TableCell>
                <TableCell>
                  <Chip 
                    label={report.status.replace('_', ' ')}
                    color={getStatusColor(report.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/consumption/${report.id}`)}
                  >
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default RecentReports;
