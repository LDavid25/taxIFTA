import {
  Add as AddIcon,
  Business as BusinessIcon,
  CloudDownload as CloudDownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  MuiAlert,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../../components/common/AlertMessage";
import LoadingScreen from "../../components/common/LoadingScreen";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  exportToExcel,
  getGroupedQuarterlyReports,
  getIndividualReports,
} from "../../services/quarterlyReportService";

const DeclarationList = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groupedReports, setGroupedReports] = useState([]);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [quarterFilter, setQuarterFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [availableQuarters, setAvailableQuarters] = useState([1, 2, 3, 4]); // Default to all quarters
  const [individualReports, setIndividualReports] = useState({});
  const [filteredReports, setFilteredReports] = useState([]);
  // State for pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 10; // 3 rows x 2 columns = 6 items per page

  // Verificar autenticación antes de cargar los reportes
  useEffect(() => {
    const checkAuthAndLoadReports = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("You are not authenticated. Please log in.");
        }
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        await fetchGroupedReports();
      } catch (error) {
        console.error("Error de autenticación:", error);
        setAlert({
          open: true,
          message: error.message || "Authentication error. Please log in.",
          severity: "error",
        });
      }
    };

    const fetchGroupedReports = async () => {
      setLoading(true);
      try {
        setAlert({
          open: false,
          message: "",
          severity: "info",
        });
        let reports = await getGroupedQuarterlyReports();

        // Esperar a que currentUser y isAdmin estén definidos
        if (
          typeof isAdmin === "undefined" ||
          typeof currentUser === "undefined"
        ) {
          return; // Esperar a que estén listos
        }

        if (!isAdmin && currentUser?.company_id) {
          console.log(
            "Filtering reports by user company:",
            currentUser.company_id,
          );
          reports = reports.filter(
            (report) =>
              report.company_id === currentUser.company_id ||
              report.companyId === currentUser.company_id,
          );
          console.log(`Reports after filtering: ${reports.length} found`);
        }

        // Load individual reports for valid reports
        const validReportsPromises = reports
          .filter((report) => report.valid_report_count > 0)
          .map(async (report) => {
            try {
              const key = `${report.company_id}_${report.quarter}_${report.year}`;
              const response = await getIndividualReports(
                report.company_id,
                report.quarter,
                report.year,
              );
              return { key, reports: response };
            } catch (error) {
              console.error("Error loading individual reports:", error);
              return null;
            }
          });

        const loadedReports = await Promise.all(validReportsPromises);
        const newIndividualReports = {};
        loadedReports.forEach((item) => {
          if (item) {
            newIndividualReports[item.key] = item.reports;
          }
        });
        setIndividualReports((prev) => ({ ...prev, ...newIndividualReports }));

        // Actualizar estados
        setGroupedReports(reports);

        // Show message if there are no reports
        if (reports.length === 0) {
          setAlert({
            open: true,
            message: isAdmin
              ? "No quarterly reports found"
              : "No reports found for your company",
            severity: "info",
          });
        }
      } catch (error) {
        console.error("=== Error al cargar reportes ===");
        console.error("Tipo de error:", error.name);
        console.error("Mensaje:", error.message);

        // Mostrar mensaje de error al usuario
        setAlert({
          open: true,
          message: error.message || "Error loading quarterly reports",
          severity: "error",
        });

        // Clear reports in case of error
        setGroupedReports([]);
      } finally {
        setLoading(false);
        // // console.log('=== Finalizada carga de reportes ===');
      }
    };

    // Solo ejecutar si currentUser y isAdmin están definidos
    if (typeof isAdmin !== "undefined" && typeof currentUser !== "undefined") {
      checkAuthAndLoadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, currentUser]);

  // Handle alert close
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Handle export to Excel
  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter === "all" ? undefined : statusFilter,
        quarter: quarterFilter === "all" ? undefined : quarterFilter,
        year: yearFilter === "all" ? undefined : yearFilter,
        companyId: companyFilter === "all" ? undefined : companyFilter,
      };

      const blob = await exportToExcel(filters);

      // Create a temporary link to download the file
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      const fileName = `quarterly-reports-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setAlert({
        open: true,
        message: "Export completed successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setAlert({
        open: true,
        message: "Error exporting to Excel",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle grouped report view
  const handleView = (companyId, quarter, year) => {
    const rolePrefix = currentUser?.role === "admin" ? "admin" : "client";
    navigate(
      `/${rolePrefix}/declarations/company/${companyId}/quarter/${quarter}/year/${year}`,
    );
  };

  // Get color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      case "submitted":
        return "info";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  // Get text based on status
  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "pending":
        return "Pending";
      case "submitted":
        return "Submitted";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  // Get unique quarters for filter
  const getUniqueQuarters = () => {
    const quarters = new Set();
    groupedReports.forEach((report) => quarters.add(report.quarter));
    return Array.from(quarters).sort();
  };

  // Get unique years for filter
  const years = useMemo(() => {
    const uniqueYears = new Set();
    groupedReports.forEach((report) => uniqueYears.add(report.year));
    return Array.from(uniqueYears).sort((a, b) => b - a); // Descending order
  }, [groupedReports]);

  // Get available quarters when year changes
  useEffect(() => {
    const fetchAvailableQuarters = async () => {
      if (yearFilter === "all" || companyFilter === "all") {
        setAvailableQuarters([1, 2, 3, 4]);
        return;
      }

      try {
        const response = await api.get(
          `/v1/quarterly-reports/company/${companyFilter}/year/${yearFilter}/quarters`,
        );
        if (response.data && response.data.quarters) {
          setAvailableQuarters(response.data.quarters);
          // If current quarter is not in available quarters, change it to 'all'
          if (
            quarterFilter !== "all" &&
            !response.data.quarters.includes(parseInt(quarterFilter))
          ) {
            setQuarterFilter("all");
          }
        } else {
          setAvailableQuarters([1, 2, 3, 4]);
        }
      } catch (error) {
        console.error("Error fetching available quarters:", error);
        setAvailableQuarters([1, 2, 3, 4]);
      }
    };

    fetchAvailableQuarters();
  }, [yearFilter, companyFilter]);

  // Get unique companies for filter
  const getUniqueCompanies = () => {
    const companies = [];
    const companyMap = new Map();

    groupedReports.forEach((report) => {
      if (report.company_id && !companyMap.has(report.company_id)) {
        companyMap.set(
          report.company_id,
          report.company_name || `Company ${report.company_id}`,
        );
        companies.push({
          id: report.company_id,
          name: companyMap.get(report.company_id),
        });
      }
    });

    return companies.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get company options for Autocomplete
  const companyOptions = React.useMemo(
    () => getUniqueCompanies(),
    [groupedReports],
  );

  // Find the selected company
  const selectedCompany =
    companyOptions.find((company) => company.id.toString() === companyFilter) ||
    null;

  // Load individual reports for each group
  useEffect(() => {
    if (groupedReports.length > 0) {
      const loadIndividualReports = async () => {
        // console.log('=== Starting individual reports load ===');
        // console.log('Total groups to process:', groupedReports.length);
        const reportsMap = {};

        // Process each group to load its individual reports
        for (const group of groupedReports) {
          const key = `${group.company_id}_${group.quarter}_${group.year}`;

          if (!individualReports[key]) {
            try {
              // console.log(`Loading individual reports for group: ${key}`);
              const response = await getIndividualReports(
                group.company_id,
                group.quarter,
                group.year,
              );

              // Check if response has the expected structure
              const reports = response.data?.reports || [];
              // console.log(`Found ${reports.length} reports for group ${key}`);

              // Update individual reports map
              reportsMap[key] = reports;
            } catch (error) {
              console.error(
                `Error loading individual reports for ${key}:`,
                error,
              );
              reportsMap[key] = [];
            }
          } else {
            // Use already loaded reports
            reportsMap[key] = individualReports[key];
          }
        }

        // Update state with individual reports
        setIndividualReports((prev) => ({
          ...prev,
          ...reportsMap,
        }));
      };

      // Temporarily disable individual reports loading
      // loadIndividualReports();
      // console.log('Individual reports loading temporarily disabled');
    }
  }, [groupedReports]);

  // Filtros para los reportes
  useEffect(() => {
    console.log("individualReports:", individualReports);
    if (groupedReports && groupedReports.length > 0) {
      console.log("Applying filters...");
      console.log("Total grouped reports:", groupedReports.length);

      const filtered = groupedReports.filter((report) => {
        // Apply filters
        // Make sure status is in lowercase for comparison
        const currentStatus = (report.status || "").toLowerCase();
        const statusMatch =
          statusFilter === "all" ||
          (statusFilter === "in_progress" && currentStatus === "in_progress") ||
          (statusFilter === "completed" &&
            (currentStatus === "completed" || currentStatus === "success"));

        console.log("Filtro:", {
          statusFilter,
          currentStatus,
          statusMatch,
          reportId: report.id,
        });

        const quarterMatch =
          quarterFilter === "all" ||
          report.quarter.toString() === quarterFilter.toString();
        const yearMatch =
          yearFilter === "all" ||
          report.year.toString() === yearFilter.toString();
        const companyMatch =
          companyFilter === "all" ||
          report.company_id.toString() === companyFilter.toString();

        const matches =
          statusMatch && quarterMatch && yearMatch && companyMatch;
        return matches;
      });

      // console.log(`Applied filters: status=${statusFilter}, quarter=${quarterFilter}, year=${yearFilter}, company=${companyFilter}`);
      // console.log(`Reports after filtering: ${filtered.length} of ${groupedReports.length}`);

      // Reset to first page when filters change
      setPage(1);
      setFilteredReports(filtered);
    }
  }, [groupedReports, statusFilter, quarterFilter, yearFilter, companyFilter]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5">Quarterly Reports</Typography>
        </Box>

        {/* Removed Report Groups and Individual Reports counters */}
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <Autocomplete
                size="small"
                options={companyOptions}
                getOptionLabel={(option) => option.name}
                value={companyFilter === "all" ? null : selectedCompany}
                onChange={(event, newValue) => {
                  setCompanyFilter(newValue ? newValue.id.toString() : "all");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search company"
                    variant="outlined"
                    size="small"
                    placeholder="Type to search..."
                  />
                )}
                noOptionsText="No matches found"
                isOptionEqualToValue={(option, value) => option.id === value.id}
                clearOnEscape
                clearOnBlur
                blurOnSelect
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Quarter</InputLabel>
              <Select
                value={quarterFilter}
                onChange={(e) => setQuarterFilter(e.target.value)}
                label="Quarter"
              >
                <MenuItem value="all">All quarters</MenuItem>
                {availableQuarters.map((q) => (
                  <MenuItem key={`q${q}`} value={q}>
                    Q{q}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                label="Year"
              >
                <MenuItem value="all">All</MenuItem>
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Lista de reportes */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : filteredReports.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="textSecondary">
            No reports found matching the filters
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredReports
              .slice((page - 1) * itemsPerPage, page * itemsPerPage)
              .map((report) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  key={`${report.company_id}-${report.quarter}-${report.year}`}
                >
                  <Card>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <BusinessIcon />
                        </Avatar>
                      }
                      title={`${report.company_name}`}
                      subheader={`Q${report.quarter} ${report.year}`}
                      action={
                        <Chip
                          label={getStatusText(report.status)}
                          color={getStatusColor(report.status)}
                          size="small"
                          sx={{ mt: 1, mr: 1, color: "white" }}
                        />
                      }
                    />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={8}>
                          <Typography variant="body1">
                            {report.company_name} - Q{report.quarter}{" "}
                            {report.year}
                          </Typography>
                        </Grid>
                        <Grid item xs={4} sx={{ textAlign: "right" }}>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            component="span"
                          >
                            Reports:
                          </Typography>
                          <Typography variant="h6" component="span">
                            {report.valid_report_count}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions
                      sx={{ justifyContent: "flex-end", p: 2, pt: 0 }}
                    >
                      <Button
                        size="small"
                        color="info"
                        onClick={() =>
                          handleView(
                            report.company_id,
                            report.quarter,
                            report.year,
                          )
                        }
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {/* Pagination */}
          {filteredReports.length > itemsPerPage && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 4,
                mb: 2,
                width: "100%",
              }}
            >
              <Stack spacing={2}>
                <Pagination
                  count={Math.ceil(filteredReports.length / itemsPerPage)}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default DeclarationList;
