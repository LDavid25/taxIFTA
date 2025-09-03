import React from "react";
import { useNavigate } from "react-router-dom";
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
  useTheme,
} from "@mui/material";
import {
  LocalGasStation as FuelIcon,
  History as HistoryIcon,
  Description as ReportIcon,
  AccountCircle as ProfileIcon,
  Help as HelpIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";

const DashboardCliente = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const dashboardCards = [
    {
      title: "Add Record",
      description: "Add new fuel consumption records",
      icon: <FuelIcon fontSize="large" color="primary" />,
      path: "/client/consumption/create",
      color: theme.palette.primary.light,
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 1, md: 3 }, minHeight: "80vh" }}>
      <Container maxWidth="xl">
        {/* Welcome Section */}
        <Paper
          elevation={2}
          sx={{ p: 3, mb: 4, bgcolor: "primary.main", color: "white" }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome, {currentUser?.name || "User"}
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            This is your control center where you can capture and send us your
            quarterly record to report your IFTA.
          </Typography>
          <Typography variant="body1" paragraph>
            Distance Summary of distance traveled in each jurisdiction by
            vehicle. Fuel purchased by state.
          </Typography>
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
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(card.path)}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    p: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: "50%",
                      backgroundColor: `${card.color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: "primary.light",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="body2" color="primary.contrastText">
                    1
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Capture
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    your Miles & Fuel by vehicle by month and Jurisdiction
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: "primary.light",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="body2" color="primary.contrastText">
                    2
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Review
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    make changes while it is in progress{" "}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                <Box
                  sx={{
                    backgroundColor: "primary.light",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="body2" color="primary.contrastText">
                    3
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    History
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reports captured and sent
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Support Section */}
        <Paper elevation={2} sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Need Help?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            For assistance, please call (956) 381-5025 and select option 3, or{" "}
            <a href="https://web-ubq6gq6jr2lw.up-de-fra1-k8s-1.apps.run-on-seenode.com/Contact">
              click here
            </a>{" "}
            to send us a message.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardCliente;
