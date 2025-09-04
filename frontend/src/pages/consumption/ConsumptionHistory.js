import {
  AddTwoTone,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import BusinessIcon from "@mui/icons-material/Business";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import format from "date-fns/format";
import es from "date-fns/locale/es";
import parseISO from "date-fns/parseISO";
import { useSnackbar } from "notistack";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "../../constants/roles";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { getConsumptionReports } from "../../services/consumptionService";

// Mapping of state codes to full names
const STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
  PR: "Puerto Rico",
  VI: "Virgin Islands",
  GU: "Guam",
  AS: "American Samoa",
  MP: "Northern Mariana Islands",
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString) => {
  try {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";

    // Format: MMM yyyy (e.g., 'Jun 2023')
    return date.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

const getQuarter = (dateString) => {
  console.log("getQuarter called with:", dateString);

  try {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Q? ????"; // Return placeholder if date is not valid

    const month = date.getMonth() + 1; // getMonth() starts at 0 (January = 0)
    const year = date.getFullYear();
    const quarter = Math.ceil(month / 3);

    return `Q${quarter} ${year}`;
  } catch (error) {
    console.error("Error getting quarter:", error);
    return "Q? ????"; // Return placeholder if there's an error
  }
};

// Status mapping: { display: 'UI Text', value: 'api_value' }
const statusOptions = [
  { display: "All", value: "All" },
  { display: "Completed", value: "Completed" },
  { display: "Rejected", value: "Rejected" },
  { display: "In progress", value: "In_progress" },
];
const statusFilters = statusOptions.map((opt) => opt.display);

// Set color for status
const getStatusColor = (status) => {
  switch (status) {
    case "Completed":
      return "success";
    case "In progress":
      return "warning";
    case "Rejected":
      return "error";
    default:
      return "default";
  }
};
// Component to display a row in mobile view
const MobileTableRow = ({ row, onViewReceipt }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card sx={{ mb: 2, width: "100%" }}>
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
                row.status === "completed"
                  ? "success"
                  : row.status === "in_progress"
                    ? "warning"
                    : "error"
              }
              size="small"
            />
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ ml: 1 }}
            >
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s",
                }}
              />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Quarter
                </Typography>
                <Typography variant="body1">{getQuarter(row.date)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Miles
                </Typography>
                <Typography variant="body1">
                  {row.milesTraveled.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Gallons
                </Typography>
                <Typography variant="body1">
                  {row.totalGallons.toFixed(3)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  MPG
                </Typography>
                <Typography variant="body1">{row.mpg}</Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: "flex", alignItems: "center" }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ReceiptIcon />}
                  onClick={() => onViewReceipt(row.id, row)}
                  fullWidth
                >
                  View Details
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
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // States for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState(""); // Empty string for 'All companies'
  const [statusFilter, setStatusFilter] = useState("All");
  const [companies, setCompanies] = useState([]);

  // Year options (last 5 years and current)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Quarter options
  const quarterOptions = [1, 2, 3, 4];

  // States for selected year and quarter
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");

  // States for data
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filtered data and pagination
  const [filteredData, setFilteredData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0,
    totalPages: 1,
  });

  // Load companies for admin filter
  useEffect(() => {
    const fetchCompanies = async () => {
      if (isAdmin(currentUser)) {
        try {
          console.log("Fetching companies...");
          // Use the correct endpoint to get companies
          const response = await api.get("/v1/companies");
          console.log("Companies API response:", response);
          console.log(
            "Companies API response data:",
            JSON.stringify(response.data, null, 2),
          );

          // Log the first company's structure if it exists
          if (response.data?.data?.[0]) {
            console.log(
              "First company structure:",
              Object.keys(response.data.data[0]),
            );
          }

          // Log each company's structure
          if (Array.isArray(response.data.data)) {
            console.log(
              "Companies list with IDs:",
              response.data.data.map((company) => ({
                id: company.id,
                _id: company._id,
                name: company.name,
              })),
            );
          }

          setCompanies(response.data.data || []);
        } catch (error) {
          console.error("Error fetching companies:", error);
          // Don't show error if user is not admin
          if (isAdmin(currentUser)) {
            enqueueSnackbar("Error loading companies", { variant: "error" });
          }
        }
      }
    };

    fetchCompanies();
  }, [currentUser, enqueueSnackbar]);

  // Load data when filters or pagination changes
  useEffect(() => {
    console.log("useEffect triggered with:", {
      companyFilter,
      statusFilter,
      searchTerm,
      selectedYear,
      selectedQuarter,
      page: pagination.page,
      rowsPerPage: pagination.rowsPerPage,
    });

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Current user:", {
          id: currentUser?.id,
          email: currentUser?.email,
          role: currentUser?.role,
          companyId: currentUser?.companyId,
          company: currentUser?.company,
        });

        console.log("Current filters:", {
          companyFilter,
          statusFilter,
          searchTerm,
        });

        // If no user, exit
        if (!currentUser) {
          console.log("No authenticated user");
          setReports([]);
          setFilteredData([]);
          setPagination((prev) => ({ ...prev, total: 0 }));
          setLoading(false);
          return;
        }

        // Check if user has a valid companyId
        const hasValidCompanyId =
          currentUser?.companyId ||
          currentUser?.company_id ||
          currentUser?.company?.id;

        if (!isAdmin(currentUser) && !hasValidCompanyId) {
          console.error(
            "Non-admin user without companyId, cannot load reports",
            {
              user: {
                id: currentUser?.id,
                email: currentUser?.email,
                role: currentUser?.role,
                companyId: currentUser?.companyId,
                company_id: currentUser?.company_id,
                company: currentUser?.company,
              },
            },
          );

          enqueueSnackbar(
            "Could not load your company information. Please contact the administrator.",
            {
              variant: "error",
              autoHideDuration: 10000, // Show for 10 seconds
            },
          );

          setReports([]);
          setFilteredData([]);
          setPagination((prev) => ({ ...prev, total: 0 }));
          setLoading(false);
          return;
        }

        const params = {
          page: pagination.page + 1, // API uses base 1
          limit: pagination.rowsPerPage,
        };

        console.log("Current user in fetchData:", {
          userId: currentUser?.id,
          companyId: currentUser?.companyId,
          company: currentUser?.company,
          role: currentUser?.role,
          isAdmin: isAdmin(currentUser),
        });

        // Clear existing parameters
        delete params.companyId;
        delete params.userId;

        // Get user's company ID from any possible property
        const userCompanyId =
          currentUser?.companyId ||
          currentUser?.company_id ||
          currentUser?.company?.id;

        console.log("Filter parameters:", {
          isAdmin: isAdmin(currentUser),
          userCompanyId,
          companyFilter,
          userId: currentUser?.id,
          userData: {
            id: currentUser?.id,
            email: currentUser?.email,
            role: currentUser?.role,
            companyId: currentUser?.companyId,
            company_id: currentUser?.company_id,
            company: currentUser?.company,
          },
        });

        if (isAdmin(currentUser)) {
          // For admin, filter by company if one is selected
          if (companyFilter) {
            // Try different possible ID fields
            const company = companies.find(
              (c) =>
                c.id === companyFilter ||
                c._id === companyFilter ||
                c.Id === companyFilter ||
                c.ID === companyFilter,
            );

            console.log("Admin filtering by selected company:", {
              companyFilter,
              foundCompany: company,
              allCompanies: companies,
            });

            // Use the company's ID as it appears in the database
            if (company) {
              params.companyId =
                company.id || company._id || company.Id || company.ID;
            } else {
              console.warn("Could not find company with ID:", companyFilter);
            }
          } else {
            console.log("Admin without company filter, showing all reports");
          }
        } else {
          // For non-admin users, force filter by their companyId
          if (userCompanyId) {
            params.companyId = userCompanyId;
            console.log(
              "Non-admin user, filtering by their company:",
              userCompanyId,
            );

            // Optionally add filter by user if needed
            if (currentUser?.id) {
              params.userId = currentUser.id;
              console.log("Filtering by userId:", currentUser.id);
            }
          } else {
            console.error("Non-admin user without companyId, cannot load data");
            enqueueSnackbar(
              "Could not load your company information. Please contact the administrator.",
              {
                variant: "error",
                autoHideDuration: 10000,
              },
            );
            setReports([]);
            setLoading(false);
            return;
          }
        }

        if (statusFilter !== "All") {
          const statusOption = statusOptions.find(
            (opt) => opt.display === statusFilter,
          );
          if (statusOption) {
            params.status = statusOption.value.toLowerCase();
          }
        }

        if (selectedYear) {
          params.year = selectedYear;

          if (selectedQuarter) {
            const quarterToMonthMap = {
              1: { startMonth: "01", endMonth: "03" },
              2: { startMonth: "04", endMonth: "06" },
              3: { startMonth: "07", endMonth: "09" },
              4: { startMonth: "10", endMonth: "12" },
            };

            const { startMonth, endMonth } = quarterToMonthMap[selectedQuarter];
            params.startMonth = startMonth;
            params.endMonth = endMonth;
          }
        }

        if (searchTerm) {
          params.search = searchTerm;
        }

        console.log(
          "Sending parameters to API:",
          JSON.stringify(params, null, 2),
        );
        const response = await getConsumptionReports(params);
        console.log("API Response:", {
          status: response.status,
          data: response.data,
          companyFilter,
          filteredCount: response.data?.data?.length || 0,
          firstCompanyId: response.data?.data?.[0]?.companyId || "N/A",
        });

        // Ensure response.data exists and has the expected structure
        const responseData = response?.data || {};

        // Handle different response formats
        let reportsData = [];
        if (Array.isArray(responseData)) {
          reportsData = responseData;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          reportsData = responseData.data;
        } else if (
          responseData.reports &&
          Array.isArray(responseData.reports)
        ) {
          reportsData = responseData.reports;
        }

        console.log("API response processed:", {
          rawData: responseData,
          reportsCount: reportsData.length,
          pagination: responseData.pagination || {},
          reportsSample: reportsData.slice(0, 2), // Show sample of first 2 reports
        });

        // Update state with reports
        setReports(reportsData);

        // Calculate pagination
        const totalItems =
          responseData.pagination?.total ||
          responseData.total ||
          reportsData.length;

        const totalPages =
          responseData.pagination?.totalPages ||
          Math.ceil(totalItems / pagination.rowsPerPage) ||
          1;

        console.log("Updating pagination:", {
          totalItems,
          totalPages,
          currentPage: pagination.page,
          rowsPerPage: pagination.rowsPerPage,
        });

        setPagination((prev) => ({
          ...prev,
          total: totalItems,
          totalPages: totalPages,
        }));

        setError(null);
      } catch (err) {
        console.error("Error loading reports:", err);
        setError("Could not load the reports. Please try again later.");
        enqueueSnackbar("Error loading reports", { variant: "error" });
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Reset to first page when company filter changes
  }, [
    pagination.page,
    pagination.rowsPerPage,
    statusFilter,
    searchTerm,
    companyFilter,
    enqueueSnackbar,
    currentUser,
    selectedQuarter,
    selectedYear,
  ]);

  const handleAddConsumption = () => {
    navigate("/consumption/new");
  };

  const handleChangePage = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination((prev) => ({
      ...prev,
      page: 0,
      rowsPerPage: parseInt(event.target.value, 10),
    }));
  };

  const handleViewReceipt = (id, report) => {
    const basePath = currentUser?.role === "admin" ? "/admin" : "/client";
    // Pass the full report as location state
    navigate(`${basePath}/consumption/${id}`, { state: { report } });
  };

  // Function to format report data for the table
  const formatReportData = (report) => {
    // console.log('Report data:', report); // Log to inspect report data
    // Calculate total miles and gallons
    const totalMiles =
      report.states?.reduce(
        (sum, state) => sum + (parseFloat(state.miles) || 0),
        0,
      ) || 0;
    const totalGallons =
      report.states?.reduce(
        (sum, state) => sum + (parseFloat(state.gallons) || 0),
        0,
      ) || 0;
    const mpg =
      totalMiles > 0 && totalGallons > 0
        ? (totalMiles / totalGallons).toFixed(2)
        : 0;

    // Format date (only month and year)
    const formatDate = (date) => {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleString("en-US", { month: "short", year: "numeric" });
    };

    const reportDate =
      report.report_year && report.report_month
        ? new Date(report.report_year, report.report_month - 1, 1)
        : report.createdAt || new Date();

    // Get and format unique states with format 'CODE - Name'
    const states = [
      ...new Set(
        report.states
          ?.map((s) => {
            const code = s.state_code?.toUpperCase();
            const name = STATE_NAMES[code] || "Unknown";
            return code ? `${code} - ${name}` : null;
          })
          .filter(Boolean),
      ),
    ].join(", ");

    // Get company name from different possible locations in the response
    const companyName =
      report.company?.name ||
      report.company_name ||
      (report.company && typeof report.company === "string"
        ? report.company
        : "N/A");

    // Get company ID from different possible locations in the response
    const companyId =
      report.company_id ||
      (report.company && report.company._id) ||
      (report.company && report.company.id);

    return {
      id: report.id,
      date: formatDate(reportDate),
      unitNumber: report.vehicle_plate || "N/A",
      companyName: companyName,
      companyId: companyId,
      milesTraveled: totalMiles,
      totalGallons: totalGallons,
      mpg: parseFloat(mpg) || 0,
      status: report.status
        ? (() => {
            const statusValue =
              report.status.charAt(0).toUpperCase() +
              report.status.slice(1).toLowerCase();
            const statusOption = statusOptions.find(
              (opt) => opt.value.toLowerCase() === statusValue.toLowerCase(),
            );
            return statusOption ? statusOption.display : statusValue;
          })()
        : "Pending",
      states: states || "N/A",
      receiptId: report.id,
      taxPaid: 0, // This should come from the backend
      // Additional data for mobile view
      quarter: report.quarterlyReport
        ? `Q${report.quarterlyReport.quarter} ${report.quarterlyReport.year}`
        : "N/A",
      notes: report.notes || "",
    };
  };

  // Effect to format data when reports change
  useEffect(() => {
    if (!reports || !Array.isArray(reports)) {
      setFilteredData([]);
      return;
    }

    try {
      // Apply format to reports
      const formatted = reports.map(formatReportData);
      setFilteredData(formatted);
    } catch (error) {
      console.error("Error processing data:", error);
      setFilteredData([]);
      enqueueSnackbar("Error processing data", { variant: "error" });
    }
  }, [reports, enqueueSnackbar]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth={false} disableGutters sx={{ p: 0 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
            p: 3,
            backgroundColor: "background.paper",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            mb: 2,
            width: "100%",
          }}
        >
          <Typography variant="h5" component="h1" fontWeight="bold">
            Review
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddTwoTone />}
            fullWidth
            sx={{
              width: { xs: "100%", sm: "auto" },
              whiteSpace: "nowrap",
            }}
            onClick={() => {
              const basePath =
                currentUser?.role === "admin" ? "/admin" : "/client";
              navigate(`${basePath}/consumption/create`);
            }}
          >
            Add record
          </Button>
        </Box>

        {/* Filters Section */}
        <Container maxWidth="xl" sx={{ px: 3, mb: 3 }}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={12}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    flexWrap: "nowrap",
                    gap: 1,
                    overflowX: "auto",
                    pb: 1,
                    "&::-webkit-scrollbar": { height: "6px" },
                  }}
                >
                  {statusOptions.map((option) => (
                    <Button
                      key={`status-${option.value}`}
                      variant={
                        statusFilter === option.value ? "contained" : "outlined"
                      }
                      color="primary"
                      size="small"
                      onClick={() => {
                        setStatusFilter(option.value);
                        setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page when changing status
                      }}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        minWidth: "auto",
                        whiteSpace: "nowrap",
                        px: 2,
                        ...(statusFilter === option.value && {
                          bgcolor: "primary.main",
                          color: "white",
                          "&:hover": {
                            bgcolor: "primary.dark",
                          },
                        }),
                      }}
                    >
                      {option.display}
                    </Button>
                  ))}
                </Stack>
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Search by unit #"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page when searching
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
              {isAdmin(currentUser) && (
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Filter by company"
                    variant="outlined"
                    size="small"
                    value={companyFilter || ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : e.target.value;
                      console.log(
                        "Company filter changed to:",
                        value,
                        "Type:",
                        typeof value,
                      );
                      setCompanyFilter(value);
                      setPagination((prev) => ({ ...prev, page: 0 }));
                    }}
                    select
                    SelectProps={{
                      native: false,
                      MenuProps: {
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem key="all-companies" value="">
                      <em>All companies</em>
                    </MenuItem>
                    {Array.isArray(companies) && companies.length > 0 ? (
                      companies
                        .map((company) => {
                          // Extract company ID and name from different possible properties
                          const companyId =
                            company.id ||
                            company._id ||
                            company.Id ||
                            company.ID;
                          const companyName =
                            company.name || company.Name || "Unnamed Company";

                          if (!companyId) {
                            console.warn(
                              "Skipping company with missing ID:",
                              company,
                            );
                            return null;
                          }

                          return (
                            <MenuItem key={companyId} value={companyId}>
                              {companyName}
                            </MenuItem>
                          );
                        })
                        .filter(Boolean) // Remove any null entries
                    ) : (
                      <MenuItem disabled>No companies available</MenuItem>
                    )}
                  </TextField>
                </Grid>
              )}
              <Grid item xs={6} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Year"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 0 }));
                  }}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option key="all-years" value="">
                    All Years
                  </option>
                  {yearOptions.map((year) => (
                    <option key={`year-${year}`} value={year}>
                      {year}
                    </option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} md={1}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Q"
                  value={selectedQuarter}
                  onChange={(e) => {
                    setSelectedQuarter(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 0 }));
                  }}
                  disabled={!selectedYear}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option key="all-quarters" value="">
                    All
                  </option>
                  {quarterOptions.map((quarter) => (
                    <option key={`quarter-${quarter}`} value={quarter}>
                      Q{quarter}
                    </option>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Container>

        {/* Table Section */}
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
          {loading && reports.length === 0 ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              Error loading reports: {error}
            </Alert>
          ) : isMobile ? (
            // Mobile view - Cards
            <Box sx={{ p: 2 }}>
              {filteredData
                .slice(
                  pagination.page * pagination.rowsPerPage,
                  pagination.page * pagination.rowsPerPage +
                    pagination.rowsPerPage,
                )
                .map((row) => (
                  <MobileTableRow
                    key={row.id}
                    row={row}
                    onViewReceipt={handleViewReceipt}
                  />
                ))}
            </Box>
          ) : isMobile ? (
            // Mobile view - Cards
            <Box sx={{ p: 2 }}>
              {filteredData
                .slice(
                  pagination.page * pagination.rowsPerPage,
                  pagination.page * pagination.rowsPerPage +
                    pagination.rowsPerPage,
                )
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
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell>Date</TableCell>
                    <TableCell>Unit #</TableCell>
                    {isAdmin(currentUser) && <TableCell>Company</TableCell>}
                    <TableCell>Quarter</TableCell>
                    <TableCell align="right">Miles Traveled</TableCell>
                    <TableCell align="right">Total Gallons</TableCell>
                    {isAdmin(currentUser) && (
                      <TableCell align="right">MPG</TableCell>
                    )}
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData
                    .slice(
                      pagination.page * pagination.rowsPerPage,
                      pagination.page * pagination.rowsPerPage +
                        pagination.rowsPerPage,
                    )
                    .map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{formatDate(row.date)}</TableCell>
                        <TableCell>{row.unitNumber}</TableCell>
                        {isAdmin(currentUser) && (
                          <TableCell>{row.companyName || "N/A"}</TableCell>
                        )}
                        <TableCell>{getQuarter(row.date)}</TableCell>
                        <TableCell align="right">
                          {row.milesTraveled.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="right">
                          {row.totalGallons.toFixed(3)}
                        </TableCell>
                        {isAdmin(currentUser) && (
                          <TableCell align="right">{row.mpg}</TableCell>
                        )}
                        <TableCell>
                          <Chip
                            label={row.status}
                            color={
                              row.status === "Paid"
                                ? "success"
                                : row.status === "Pending"
                                  ? "warning"
                                  : "default"
                            }
                            size="small"
                            sx={{ minWidth: 80, borderRadius: 1 }}
                          />
                        </TableCell>
                        <TableCell align="left">{row.unitNumber}</TableCell>
                        <TableCell align="left">
                          {row.milesTraveled.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell align="left">
                          {row.totalGallons.toFixed(2)}
                        </TableCell>
                        {isAdmin(currentUser) && (
                          <TableCell align="left">{row.mpg}</TableCell>
                        )}
                        <TableCell align="left">
                          <Chip
                            label={row.status}
                            color={getStatusColor(row.status)}
                            size="small"
                            sx={{
                              minWidth: 80,
                              borderRadius: 1,
                              color: "white",
                            }}
                          />
                        </TableCell>
                        <TableCell align="left">
                          <IconButton
                            onClick={() => handleViewReceipt(row.id, row)}
                            size="small"
                            sx={{ color: "primary.main" }}
                            aria-label="Ver detalles"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          {row.status !== "Completed" ? (
                            <IconButton
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/companies/edit/${row.companyId}`);
                              }}
                              aria-label="edit"
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          ) : null}
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
            count={pagination.total}
            rowsPerPage={pagination.rowsPerPage}
            page={pagination.page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} of ${count !== -1 ? count : `more to ${to}`}`
            }
            sx={{
              borderTop: "1px solid rgba(224, 224, 224, 1)",
              "& .MuiTablePagination-toolbar": {
                flexWrap: "wrap",
                justifyContent: "center",
              },
            }}
          />
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default ConsumptionHistory;
