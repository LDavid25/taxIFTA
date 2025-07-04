import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea, 
  CardMedia,
  Button,
  Divider,
  useTheme
} from '@mui/material';
import { 
  LocalGasStation as FuelIcon,
  History as HistoryIcon,
  Description as ReportIcon,
  AccountCircle as ProfileIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const DashboardCliente = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const dashboardCards = [
    {
      title: 'Registrar Consumo',
      description: 'Agrega nuevos registros de consumo de combustible',
      icon: <FuelIcon fontSize="large" color="primary" />,
      path: '/client/consumption/create',
      color: theme.palette.primary.light
    },
    {
      title: 'Historial de Consumo',
      description: 'Revisa y gestiona tu historial de consumo',
      icon: <HistoryIcon fontSize="large" color="secondary" />,
      path: '/client/consumption',
      color: theme.palette.secondary.light
    },
    {
      title: 'Reportes',
      description: 'Genera y descarga reportes de consumo',
      icon: <ReportIcon fontSize="large" style={{ color: theme.palette.success.main }} />,
      path: '/client/reports',
      color: theme.palette.success.light
    },
    {
      title: 'Mi Perfil',
      description: 'Administra la información de tu cuenta',
      icon: <ProfileIcon fontSize="large" color="action" />,
      path: '/client/profile',
      color: theme.palette.grey[200]
    }
  ];

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 }, minHeight: '80vh' }}>
      <Container maxWidth="xl">
        {/* Welcome Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Bienvenido, {currentUser?.name || 'Usuario'}
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Panel de Control de Consumo de Combustible
          </Typography>
          <Typography variant="body1" paragraph>
            Este es tu centro de control donde puedes gestionar todos tus registros de consumo de combustible 
            y generar reportes para el cumplimiento de IFTA.
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<HelpIcon />}
            onClick={() => navigate('/client/help')}
            sx={{ mt: 1 }}
          >
            ¿Cómo funciona?
          </Button>
        </Paper>

        {/* Quick Actions */}
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Acciones Rápidas
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {dashboardCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => navigate(card.path)}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 2
                  }}
                >
                  <Box 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderRadius: '50%',
                      backgroundColor: `${card.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography gutterBottom variant="h6" component="div">
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Guide */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Guía Rápida
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'primary.light', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0
                }}>
                  <Typography variant="body2" color="primary.contrastText">1</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Registra tu consumo</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ingresa los datos de consumo de combustible de tus vehículos de forma regular.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'primary.light', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0
                }}>
                  <Typography variant="body2" color="primary.contrastText">2</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Revisa tus reportes</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitorea tu historial y genera reportes detallados de consumo.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ 
                  backgroundColor: 'primary.light', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mr: 2,
                  flexShrink: 0
                }}>
                  <Typography variant="body2" color="primary.contrastText">3</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Cumple con IFTA</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Obtén los informes necesarios para cumplir con los requisitos de IFTA.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Support Section */}
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            ¿Necesitas ayuda?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Nuestro equipo de soporte está listo para ayudarte con cualquier pregunta o problema que puedas tener.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate('/client/support')}
          >
            Contactar Soporte
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardCliente;
