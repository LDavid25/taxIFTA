import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Description as ReportIcon,
  People as UsersIcon,
  Business as CompanyIcon,
  CheckCircle as ApprovedIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  TrendingUp as ChartIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "../../components/common/LoadingScreen";
import dashboardService from "../../services/dashboardService";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

// Datos iniciales
const initialData = {
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    totalCompanies: 0,
    pendingApprovals: 0,
    reportsThisMonth: 0,
    reportsLastMonth: 0,
    activeReports: 0,
    pendingReports: 0,
    reportsGrowth: 0,
  },
  recentActivity: [],
  reportsByStatus: [],
  monthlyReports: [],
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(initialData);
  const { currentUser } = useAuth();

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("Iniciando carga de datos del dashboard...");
        setLoading(true);

        console.log("Llamando a dashboardService.getDashboardStats()...");
        const response = await dashboardService.getDashboardStats();
        console.log("RESPUESTA DEL SERVIDOR DASHBOARD ADMIN:", response);

        if (response && response.data) {
          console.log("Datos recibidos:", response.data);

          if (response.data.success) {
            // Asegurar que todos los datos sean arrays válidos
            const dashboardData = {
              stats: {
                ...response.data.data.stats,
                totalUsers: parseInt(response.data.data.stats.totalUsers) || 0,
                activeUsers:
                  parseInt(response.data.data.stats.activeUsers) || 0,
                totalCompanies:
                  parseInt(response.data.data.stats.totalCompanies) || 0,
                totalReports:
                  parseInt(response.data.data.stats.totalReports) || 0,
              },
              topStates: Array.isArray(response.data.data.topStates)
                ? response.data.data.topStates.map((item) => ({
                    state_code: item.state_code,
                    total_miles: Number(item.total_miles) || 0,
                    total_gallons: Number(item.total_gallons) || 0,
                  }))
                : [],
            };

            console.log("Datos procesados para el estado:", dashboardData);

            setData(dashboardData);
          } else {
            console.error(
              "Error en la respuesta del servidor:",
              response.data.message,
            );
            toast.error(
              `Error del servidor: ${response.data.message || "Error desconocido"}`,
            );
          }
        } else {
          console.error("Respuesta inesperada del servidor:", response);
          toast.error("Respuesta inesperada del servidor");
        }
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        if (error.response) {
          // El servidor respondió con un estado de error
          console.error("Detalles del error:", {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          });
          toast.error(
            `Error ${error.response.status}: ${error.response.data?.message || "Error desconocido"}`,
          );
        } else if (error.request) {
          // La solicitud fue hecha pero no hubo respuesta
          console.error("No se recibió respuesta del servidor:", error.request);
          toast.error(
            "No se pudo conectar con el servidor. Por favor, verifica tu conexión.",
          );
        } else {
          // Algo más causó un error
          console.error("Error al configurar la solicitud:", error.message);
          toast.error(`Error: ${error.message}`);
        }
      } finally {
        console.log("Finalizando carga de datos del dashboard");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading admin dashboard..." />;
  }

  const { stats, recentActivity, reportsByStatus, monthlyReports } = data;

  const getActivityIcon = (type) => {
    switch (type) {
      case "report":
        return <ReportIcon color="primary" />;
      case "user":
        return <UsersIcon color="secondary" />;
      case "company":
        return <CompanyIcon color="info" />;
      case "approval":
        return <ApprovedIcon color="success" />;
      default:
        return <ReportIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Administration Panel
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome, {currentUser?.name || "Administrator"}. Here's a summary of
          system activity.
        </Typography>
      </Box>

      {/* Tarjetas de resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid
          item
          xs={12}
          sm={6}
          md={3}
          component={Link}
          to="/admin/declarations"
          sx={{ textDecoration: "none" }}
        >
          <Card elevation={3} sx={{ "&:hover": { boxShadow: 6 } }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    New Reports
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalReports}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Typography
                      variant="body2"
                      color="success.main"
                      sx={{ mr: 1 }}
                    >
                      {stats.totalReports} reports
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: "info.light", width: 56, height: 56 }}>
                  <ReportIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={3}
          component={Link}
          to="/admin/companies"
          sx={{ textDecoration: "none" }}
        >
          <Card elevation={3} sx={{ "&:hover": { boxShadow: 6 } }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Companies
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalCompanies}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Typography
                      variant="body2"
                      color="success.main"
                      sx={{ mr: 1 }}
                    >
                      {stats.totalCompanies} active
                    </Typography>
                  </Box>
                </Box>
                <Avatar
                  sx={{ bgcolor: "secondary.light", width: 56, height: 56 }}
                >
                  <CompanyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          item
          xs={12}
          sm={6}
          md={3}
          component={Link}
          to="/admin/users"
          sx={{ textDecoration: "none" }}
        >
          <Card elevation={3} sx={{ "&:hover": { boxShadow: 6 } }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Users
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalUsers}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Typography
                      variant="body2"
                      color="success.main"
                      sx={{ mr: 1 }}
                    >
                      {stats.activeUsers} active
                    </Typography>
                  </Box>
                </Box>
                <Avatar
                  sx={{ bgcolor: "primary.light", width: 56, height: 56 }}
                >
                  <UsersIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico de estados más recorridos */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 5 States by Miles Traveled
              </Typography>
              <Box sx={{ height: 400 }}>
                {data.topStates && data.topStates.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.topStates}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                      barGap={0}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="state_code"
                        label={{
                          value: "State",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#8884d8"
                        label={{
                          value: "Miles",
                          angle: -90,
                          position: "insideLeft",
                        }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#82ca9d"
                        label={{
                          value: "Gallons",
                          angle: 90,
                          position: "insideRight",
                        }}
                      />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "Miles"
                            ? [
                                `${Number(value).toLocaleString()} miles`,
                                "Miles",
                              ]
                            : [
                                `${Number(value).toLocaleString()} gallons`,
                                "Gallons",
                              ]
                        }
                        labelFormatter={(label) => `State: ${label}`}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="total_miles"
                        name="Miles"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="total_gallons"
                        name="Gallons"
                        fill="#82ca9d"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="100%"
                  >
                    <Typography variant="body1" color="textSecondary">
                      No data available to display
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mensaje de bienvenida y guía rápida */}
      <Box mt={4}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Welcome to the Administration Panel
            </Typography>
            <Typography variant="body1" paragraph>
              This panel provides you with an overview of the system status and
              allows you to efficiently manage resources.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="flex-start">
                  <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="subtitle2">Manage Users</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage system users, their permissions, and access levels.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="flex-start">
                  <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="subtitle2">Monitor Reports</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Review and approve submitted IFTA reports.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="flex-start">
                  <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="subtitle2">Configuration</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customize system settings according to your needs.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
