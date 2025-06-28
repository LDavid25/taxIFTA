import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Description as ReportIcon,
  TrendingUp as ChartIcon,
  LocalGasStation as FuelIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';
import SummaryCard from '../../components/dashboard/SummaryCard';
import ConsumptionByStateChart from '../../components/dashboard/ConsumptionByStateChart';
import RecentReports from '../../components/dashboard/RecentReports';
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    reports: {
      total: 0,
      inProgress: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      recent: []
    },
    consumption: {
      totalMiles: 0,
      totalGallons: 0,
      avgMPG: 0,
      byState: []
    }
  });

  // Simulación de carga de datos
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // En una implementación real, esto sería una llamada a la API
        setTimeout(() => {
          setDashboardData({
            reports: {
              total: 24,
              inProgress: 8,
              pending: 4,
              approved: 10,
              rejected: 2,
              recent: [
                { 
                  id: '1', 
                  vehicle_plate: 'ABC123', 
                  report_year: 2025, 
                  report_month: 5, 
                  status: 'in_progress',
                  total_miles: 1250.5,
                  total_gallons: 125.3
                },
                { 
                  id: '2', 
                  vehicle_plate: 'XYZ789', 
                  report_year: 2025, 
                  report_month: 4, 
                  status: 'pending',
                  total_miles: 980.25,
                  total_gallons: 98.2
                },
                { 
                  id: '3', 
                  vehicle_plate: 'DEF456', 
                  report_year: 2025, 
                  report_month: 3, 
                  status: 'approved',
                  total_miles: 1100.75,
                  total_gallons: 112.8
                },
                { 
                  id: '4', 
                  vehicle_plate: 'GHI789', 
                  report_year: 2025, 
                  report_month: 2, 
                  status: 'rejected',
                  total_miles: 875.5,
                  total_gallons: 89.3
                },
                { 
                  id: '5', 
                  vehicle_plate: 'JKL012', 
                  report_year: 2025, 
                  report_month: 1, 
                  status: 'approved',
                  total_miles: 1025.25,
                  total_gallons: 105.7
                }
              ]
            },
            consumption: {
              totalMiles: 12568.75,
              totalGallons: 1256.25,
              avgMPG: 10.0,
              byState: [
                { state: 'TX', miles: 3250, gallons: 325 },
                { state: 'NM', miles: 2750, gallons: 280 },
                { state: 'AZ', miles: 1980, gallons: 210 },
                { state: 'CA', miles: 3120, gallons: 290 },
                { state: 'CO', miles: 1468.75, gallons: 151.25 }
              ]
            }
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingScreen message="Cargando dashboard..." />;
  }

  const { reports, consumption } = dashboardData;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Panel de Control IFTA</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/consumption/new')}
        >
          Nuevo Informe
        </Button>
      </Box>
      
      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Informes Totales"
            value={reports.total}
            icon={<ReportIcon />}
            color="primary"
            subtext={`${reports.inProgress} en progreso`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Millas Totales"
            value={consumption.totalMiles.toLocaleString()}
            icon={<ChartIcon />}
            color="info"
            subtext={`${consumption.avgMPG} MPG promedio`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Consumo Total"
            value={`${consumption.totalGallons.toLocaleString()} gal`}
            icon={<FuelIcon />}
            color="success"
            subtext={`${reports.approved} informes aprobados`}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Pendientes"
            value={`${reports.pending + reports.inProgress}`}
            icon={<PendingIcon />}
            color="warning"
            subtext={`${reports.pending} por revisar`}
          />
        </Grid>
      </Grid>
      
      {/* Gráficos y datos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <ConsumptionByStateChart data={consumption.byState} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Resumen Trimestral
            </Typography>
            <Box sx={{ textAlign: 'center', my: 2 }}>
              <Typography variant="h3" color="primary">
                {consumption.avgMPG}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                MPG Promedio
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {reports.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aprobados
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">
                  {reports.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pendientes
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="error.main">
                  {reports.rejected}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rechazados
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Últimos informes y vencimientos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <RecentReports reports={reports.recent} />
        </Grid>
        <Grid item xs={12} md={4}>
          <UpcomingDeadlines />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
