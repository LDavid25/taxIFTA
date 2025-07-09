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
      title: 'Record Consumption',
      description: 'Add new fuel consumption records',
      icon: <FuelIcon fontSize="large" color="primary" />,
      path: '/client/consumption/create',
      color: theme.palette.primary.light
    },
    {
      title: 'Consumption History',
      description: 'View and manage your consumption history',
      icon: <HistoryIcon fontSize="large" color="secondary" />,
      path: '/client/consumption',
      color: theme.palette.secondary.light
    },
    {
      title: 'Reports',
      description: 'Generate and download consumption reports',
      icon: <ReportIcon fontSize="large" style={{ color: theme.palette.success.main }} />,
      path: '/client/declarations',
      color: theme.palette.success.light
    },
    {
      title: 'My Profile',
      description: 'Manage your account information',
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
            Welcome, {currentUser?.name || 'User'}
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Fuel Consumption Control Panel
          </Typography>
          <Typography variant="body1" paragraph>
            This is your control center where you can manage all your fuel consumption records 
            and generate reports for IFTA compliance.
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<HelpIcon />}
            onClick={() => navigate('/client/help')}
            sx={{ mt: 1 }}
          >
            How does it work?
          </Button>
        </Paper>

        {/* Quick Actions */}
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Quick Actions
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
            Quick Guide
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
                  <Typography variant="subtitle2" gutterBottom>Record Your Consumption</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Regularly enter fuel consumption data for your vehicles.
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
                  <Typography variant="subtitle2" gutterBottom>Review Your Reports</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitor your history and generate detailed consumption reports.
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
                  <Typography variant="subtitle2" gutterBottom>IFTA Compliance</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get the necessary reports to meet IFTA requirements.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Support Section */}
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Need Help?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Our support team is ready to assist you with any questions or issues you may have.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate('/client/support')}
          >
            Contact Support
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardCliente;
