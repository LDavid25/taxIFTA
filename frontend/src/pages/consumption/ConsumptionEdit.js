import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { getCompanies } from "../../services/companyService";
import {
  checkExistingReport,
  createConsumptionReport,
  updateConsumptionReport,
  getConsumptionReportById,
  trashConsumptionReport,
} from "../../services/consumptionService";

import {
  Add as AddIcon,
  CheckCircleOutline,
  Delete as DeleteIcon,
  DeleteOutline as DeleteOutlineIcon,
  Save,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format, min } from "date-fns";
import { Link as RouterLink } from "react-router-dom";

const maxDateToSelect = new Date().getFullYear(); // current year
const minDateToSelect = maxDateToSelect - 10; // 10 years ago

// Validation Schema
const validationSchema = Yup.object({
  unitNumber: Yup.string()
    .required("Unit number is required")
    .matches(/^[A-Za-z0-9-]+$/, "Please enter a valid unit number"),
  year: Yup.number()
    .typeError("Must be a number")
    .required("Year is required")
    .integer("Must be a valid year")
    .min(minDateToSelect, `Year must be ${minDateToSelect} or later`)
    .max(maxDateToSelect, `Year cannot be after ${maxDateToSelect}`),
  month: Yup.number()
    .typeError("Must be a number")
    .required("Month is required")
    .integer("Must be a valid month")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  stateEntries: Yup.array().of(
    Yup.object().shape({
      state: Yup.string()
        .matches(/^[A-Z]{2}$/, "Invalid state code")
        .nullable(),
      miles: Yup.number()
        .typeError("Must be a number")
        .nullable()
        .min(1, "Miles cannot be negative"),
      gallons: Yup.number()
        .typeError("Must be a number")
        .nullable()
        .min(0, "Gallons cannot be negative"),
    }),
  ),
});

const ConsumptionEdit = () => {
  const { id } = useParams();
  const { currentUser, isAdmin } = useAuth(); // Get currentUser and isAdmin from auth context
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportStatus, setReportStatus] = useState('draft'); // Estado para almacenar el estado actual del reporte
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [submitStatus, setSubmitStatus] = useState("draft"); // 'draft' or 'in_progress'
  const [isReportValid, setIsReportValid] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [open, setOpen] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenSave = () => setOpen(true);
  const handleCloseSave = () => setOpen(false);

  const handleOpenSubmit = () => setSubmitDialogOpen(true);
  const handleCloseSubmit = () => setSubmitDialogOpen(false);

  // Función para manejar la eliminación lógica del reporte
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const [attachmentsToRemove, setAttachmentsToRemove] = useState([]);

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await trashConsumptionReport(id);

      setSnackbar({
        open: true,
        message: 'Report deleted successfully',
        severity: 'success',
        autoHideDuration: 3000,
      });

      // Redirigir a la lista de reportes después de un breve retraso
      setTimeout(() => {
        const basePath = currentUser?.role === 'admin' ? '/admin' : '/client';
        navigate(`${basePath}/consumption`);
      }, 1000);

    } catch (error) {
      console.error('Error deleting report:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error deleting report',
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleFileUpload = (newFiles) => {
    const validFiles = Array.from(newFiles).filter((file) =>
      ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(
        file.type,
      ),
    );

    if (validFiles.length > 0) {
      const filesWithPreview = validFiles.map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        id: Math.random().toString(36).substr(2, 9),
      }));

      setUploadedFiles((prev) => [...prev, ...filesWithPreview]);
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (id) => {
    // Check if it's an existing attachment
    const existingAttachment = existingAttachments.find((att) => att.id === id);
    if (existingAttachment) {
      removeExistingAttachment(id);
      return;
    }

    // Handle newly uploaded files
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((file) => file.id !== id);
    });

    // Update selected files by removing the one that matches the id
    setSelectedFiles((prev) =>
      prev.filter((file) => {
        // For File objects, we need to match by name since they don't have an id
        const uploadedFile = uploadedFiles.find((f) => f.id === id);
        return uploadedFile ? file.name !== uploadedFile.file.name : true;
      }),
    );
  };

  const removeExistingAttachment = (attachmentId) => {
    setAttachmentsToRemove((prev) => [...prev, attachmentId]);
    setExistingAttachments((prev) =>
      prev.filter((att) => att.id !== attachmentId),
    );
  };

  const states = [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
  ];

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const getQuartersForYear = (selectedYear) => {
    const currentYear = new Date().getFullYear();
    const maxQuarter =
      selectedYear === currentYear ? Math.ceil(currentMonth / 3) : 4;
    return Array.from({ length: maxQuarter }, (_, i) => i + 1);
  };

  const getMonthsForQuarter = (year, quarter) => {
    const quarterMonths = {
      1: [1, 2, 3],
      2: [4, 5, 6],
      3: [7, 8, 9],
      4: [10, 11, 12],
    };

    let months = quarterMonths[quarter] || [];

    if (year === currentYear) {
      months = months.filter((m) => m <= currentMonth);
    }

    return months.map((m) => ({
      month: m,
      year,
      isCurrent: year === currentYear && m === currentMonth,
      showYear: true,
    }));
  };

  const yearsToSelect = Array.from(
    { length: maxDateToSelect - minDateToSelect + 1 },
    (_, i) => maxDateToSelect - i,
  );

  const [showJurisdictions, setShowJurisdictions] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    formik.setFieldValue("month", currentMonth);
    formik.setFieldValue("year", currentYear);
    formik.setFieldValue("quarter", Math.ceil(currentMonth / 3));
  }, []);

  const handleMonthChange = (event) => {
    const selectedMonth = parseInt(event.target.value, 10);
    const selectedMonthData = formik.values.displayMonths?.find(
      (m) => m.month === selectedMonth,
    );

    if (selectedMonthData) {
      formik.setFieldValue("month", selectedMonth);
      if (selectedMonthData.year !== formik.values.year) {
        formik.setFieldValue("year", selectedMonthData.year);
      }
      const selectedQuarter = Math.ceil(selectedMonth / 3);
      formik.setFieldValue("quarter", selectedQuarter);
    }
  };

  const handleContinue = async (values) => {
    try {
      if (!values.unitNumber || !values.year || !values.month) {
        setSnackbar({
          open: true,
          message: "Please fill in all required fields",
          severity: "error",
        });
        return false;
      }

      setIsChecking(true);

      try {
        // Check if report exists (but allow editing current report)
        const existingReport = await checkExistingReport(
          values.unitNumber,
          values.year,
          values.month,
        );

        if (
          existingReport &&
          existingReport.exists &&
          existingReport.report.id !== id
        ) {
          setSnackbar({
            open: true,
            message:
              "A report already exists for this unit in the selected period",
            severity: "error",
            autoHideDuration: 5000,
          });
          setIsChecking(false);
          return false;
        }

        setFormData(values);
        setShowJurisdictions(true);

        setSnackbar({
          open: true,
          message: "Please complete the jurisdiction details.",
          severity: "success",
          autoHideDuration: 5000,
        });

        setIsReportValid(true);
        return true;
      } catch (error) {
        console.error("Error al verificar reporte existente:", error);
        setFormData(values);
        setShowJurisdictions(true);
        setIsReportValid(true);
        setIsChecking(false);
        return true;
      }
    } catch (error) {
      console.error("Error al verificar el reporte:", error);
      let errorMessage = "Error al verificar el reporte";

      if (error.response) {
        const { status, data } = error.response;
        if (status === 400 && data?.message) {
          errorMessage = data.message;
        } else if (status === 401) {
          errorMessage = "Unauthorized. Please log in again.";
          setTimeout(() => navigate("/login"), 2000);
        } else if (status === 403) {
          errorMessage = "You do not have permission to perform this action";
        } else if (status === 404) {
          errorMessage = "Resource not found";
        } else if (status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (error.request) {
        errorMessage =
          "Could not connect to the server. Please check your internet connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
        autoHideDuration: 5000,
      });

      setIsLoading(false);
      return false;
    }
  };

  const handleSubmit = async (values) => {
    try {
      setIsLoading(true);

      const formDataToSend = new FormData();

      // Get user and company info
      const userId = currentUser?.id || currentUser?._id;
      const companyId =
        values.companyId || currentUser?.company_id || currentUser?.companyId;

      if (!userId) {
        throw new Error("User ID not found");
      }

      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // Add basic report data
      formDataToSend.append(
        "vehicle_plate",
        String(values.unitNumber || "")
          .trim()
          .toUpperCase(),
      );
      formDataToSend.append(
        "report_year",
        Number(values.year) || new Date().getFullYear(),
      );
      formDataToSend.append(
        "report_month",
        Number(values.month) || new Date().getMonth() + 1,
      );
      formDataToSend.append("company_id", companyId);
      formDataToSend.append("created_by", userId);

      let finalStatus = "in_progress"; // Default status
      if (submitStatus === "submit" || submitStatus === "sent") {
        finalStatus = "sent";
      }

      formDataToSend.append("status", finalStatus);

      // Add notes if present
      if (values.notes) {
        formDataToSend.append("notes", values.notes);
      }

      // Add state entries
      if (values.stateEntries && values.stateEntries.length > 0) {
        values.stateEntries.forEach((entry, index) => {
          if (entry && entry.state) {
            const stateCode =
              typeof entry.state === "object"
                ? entry.state.code
                : String(entry.state).toUpperCase();

            if (stateCode) {
              formDataToSend.append(`states[${index}].state_code`, stateCode);
              formDataToSend.append(
                `states[${index}].miles`,
                (parseFloat(entry.miles) || 0).toFixed(2),
              );
              formDataToSend.append(
                `states[${index}].gallons`,
                (parseFloat(entry.gallons) || 0).toFixed(3),
              );
            }
          }
        });
      }

      // Add new files to upload
      if (selectedFiles?.length > 0) {
        selectedFiles.forEach((file) => {
          if (file instanceof File) {
            formDataToSend.append("attachments", file);
          }
        });
      }

      // Add attachments to remove
      if (attachmentsToRemove.length > 0) {
        attachmentsToRemove.forEach((attachmentId, index) => {
          formDataToSend.append(`attachmentsToRemove[${index}]`, attachmentId);
        });
      }

      // Show loading state
      setSnackbar({
        open: true,
        message: "Updating report...",
        severity: "info",
        autoHideDuration: null,
      });

      const response = await updateConsumptionReport(id, formDataToSend);

      // Show success message
      setSnackbar({
        open: true,
        message: "Report updated successfully",
        severity: "success",
        autoHideDuration: 3000,
      });

      // Reset form and navigate back after a short delay
      setTimeout(() => {
        formik.resetForm();
        setSelectedFiles([]);
        setUploadedFiles([]);
        setExistingAttachments([]);
        setAttachmentsToRemove([]);

        const basePath = currentUser?.role === "admin" ? "/admin" : "/client";
        navigate(`${basePath}/consumption`);
      }, 1000);
    } catch (error) {
      console.error("Error updating report:", error);
      let errorMessage = "Error updating the report";

      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
        console.error("Error response data:", error.response.data);
      } else if (error.request) {
        errorMessage =
          "No response received from the server. Please try again.";
        console.error("No response received:", error.request);
      } else {
        errorMessage = error.message || errorMessage;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
        autoHideDuration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (values) => {
    if (!showJurisdictions) {
      return await handleContinue(values);
    }

    return await handleSubmit(values);
  };

  const initialValues = {
    unitNumber: "",
    year: currentYear,
    month: currentMonth,
    quarter: Math.ceil(currentMonth / 3),
    companyId: isAdmin
      ? ""
      : currentUser?.company_id || currentUser?.companyId || "",
    stateEntries: [{ state: null, miles: "", gallons: "" }],
    files: [],
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: handleFormSubmit,
  });

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const isFormValid = () => {
    const isUnitPeriodValid =
      formik.values.unitNumber && formik.values.year && formik.values.month;
    if (!showJurisdictions) return isUnitPeriodValid;

    const isJurisdictionsValid = formik.values.stateEntries?.every(
      (entry) =>
        entry.state &&
        entry.miles !== "" &&
        entry.miles !== null &&
        !isNaN(entry.miles) &&
        entry.gallons !== "" &&
        entry.gallons !== null &&
        !isNaN(entry.gallons),
    );

    return isUnitPeriodValid && isJurisdictionsValid && isReportValid;
  };

  const quarters = getQuartersForYear(formik.values.year);
  const displayMonths = getMonthsForQuarter(
    formik.values.year,
    formik.values.quarter,
  );

  useEffect(() => {
    formik.setFieldValue("quarter", Math.ceil(formik.values.month / 3));
  }, [formik.values.month]);

  useEffect(() => {
    const loadCompanies = async () => {
      if (isAdmin) {
        try {
          setIsLoadingCompanies(true);
          const response = await getCompanies();
          const companiesData = response?.data?.data || [];
          setCompanies(companiesData);
        } catch (error) {
          console.error("Error loading companies:", error);
        } finally {
          setIsLoadingCompanies(false);
        }
      }
    };
    loadCompanies();
  }, [isAdmin]);

  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;

      try {
        setIsLoadingReport(true);

        // Show loading state
        setSnackbar({
          open: true,
          message: "Cargando informe...",
          severity: "info",
          autoHideDuration: null,
        });

        // Get the report data
        const report = await getConsumptionReportById(id);

        if (!report) {
          throw new Error("Not found");
        }

        // Set report status
        if (report.status) {
          setReportStatus(report.status);
        }

        // Set form values
        formik.setValues({
          unitNumber: report.vehicle_plate || "",
          year: report.report_year || currentYear,
          month: report.report_month || currentMonth,
          quarter: Math.ceil((report.report_month || currentMonth) / 3),
          companyId: report.company_id || "",
          notes: report.notes || "",
          stateEntries:
            Array.isArray(report.states) && report.states.length > 0
              ? report.states.map((state, index) => ({
                state: state.state_code || "",
                miles: state.miles !== null && state.miles !== undefined ? String(state.miles) : "",
                gallons: state.gallons !== null && state.gallons !== undefined ? String(state.gallons) : "",
                index: index,
              }))
              : [{ state: null, miles: "", gallons: "" }],
          files: [],
        });

        // Set attachments if they exist
        if (
          Array.isArray(report.attachments) &&
          report.attachments.length > 0
        ) {
          setExistingAttachments(report.attachments);
        }

        setShowJurisdictions(true);
        setIsReportValid(true);

        // Update success message
        setSnackbar({
          open: true,
          message: "Report loaded successfully",
          severity: "success",
          autoHideDuration: 3000,
        });
      } catch (error) {
        console.error("Error al cargar el informe:", error);

        const errorMessage =
          error.message || "Error al cargar los datos del informe";

        setSnackbar({
          open: true,
          message: errorMessage,
          severity: "error",
          autoHideDuration: 5000,
        });

        // Navigate back after showing the error
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      } finally {
        setIsLoadingReport(false);
      }
    };

    loadReport();
  }, [id, navigate, currentYear, currentMonth]);

  if (isLoadingReport) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading report...
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            component={RouterLink}
            to={
              currentUser?.role === "admin"
                ? "/admin/dashboard"
                : "/client/dashboard"
            }
            color="inherit"
          >
            Home
          </Link>
          <Link
            component={RouterLink}
            to={
              currentUser?.role === "admin"
                ? "/admin/consumption"
                : "/client/consumption"
            }
            color="inherit"
          >
            Reports
          </Link>
          <Typography color="text.primary">Edit Report</Typography>
        </Breadcrumbs>

        <Typography variant="h5" sx={{ mb: 1 }}>
          Edit Report
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Modify the report information below.
        </Typography>

        <form id="myForm" onSubmit={formik.handleSubmit}>
          <Grid container spacing={0}>
            <Grid item xs={12} md={8}>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "background.paper",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <Box
                  sx={{
                    mb: 2,
                    pb: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "text.primary" }}
                  >
                    Report Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter the basic information for this report
                  </Typography>
                </Box>

                <Grid
                  container
                  spacing={2}
                  sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}
                >
                  <Grid item xs={12} sm={4} md={3}>
                    <TextField
                      id="unitNumber"
                      name="unitNumber"
                      label="Unit #"
                      value={formik.values.unitNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.unitNumber &&
                        Boolean(formik.errors.unitNumber)
                      }
                      helperText={
                        formik.touched.unitNumber && formik.errors.unitNumber
                      }
                      disabled={true}
                      variant="outlined"
                      fullWidth
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  {isAdmin && (
                    <Grid item xs={12} sm={4} md={3}>
                      <FormControl
                        fullWidth
                        error={
                          formik.touched.companyId &&
                          Boolean(formik.errors.companyId)
                        }
                        variant="outlined"
                        size="small"
                      >
                        <InputLabel id="company-label">Company</InputLabel>
                        <Select
                          labelId="company-label"
                          id="companyId"
                          name="companyId"
                          value={formik.values.companyId || ""}
                          label="Company"
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          disabled={true}
                        >
                          {isLoadingCompanies ? (
                            <MenuItem value="">
                              <em>Loading companies...</em>
                            </MenuItem>
                          ) : (
                            companies.map((company) => (
                              <MenuItem key={company.id} value={company.id}>
                                {company.name}
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={4} md={2}>
                    <TextField
                      select
                      fullWidth
                      id="year"
                      name="year"
                      label="Year"
                      type="number"
                      value={formik.values.year}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.year && Boolean(formik.errors.year)}
                      helperText={formik.touched.year && formik.errors.year}
                      disabled={true}
                      variant="outlined"
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    >
                      {yearsToSelect.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item container spacing={2} xs={12} sm={4} md={4}>
                    <Grid item xs={6}>
                      <TextField
                        select
                        fullWidth
                        id="quarter"
                        name="quarter"
                        label="Quarter"
                        value={formik.values.quarter}
                        onChange={formik.handleChange}
                        variant="outlined"
                        size="small"
                        InputLabelProps={{
                          shrink: true,
                        }}
                        disabled={true}
                      >
                        {quarters.map((q) => (
                          <MenuItem key={q} value={q}>
                            Q{q}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl
                        fullWidth
                        error={
                          formik.touched.month && Boolean(formik.errors.month)
                        }
                        variant="outlined"
                        size="small"
                        disabled={true}
                      >
                        <InputLabel id="month-label">Month</InputLabel>
                        <Select
                          labelId="month-label"
                          id="month"
                          name="month"
                          value={formik.values.month}
                          label="Month"
                          onChange={handleMonthChange}
                          onBlur={formik.handleBlur}
                          disabled={true}
                        >
                          {displayMonths.map(
                            ({ month, year, isCurrent, showYear }) => {
                              const monthDate = new Date(year, month - 1, 1);
                              const monthName = monthDate.toLocaleString(
                                "default",
                                { month: "long" },
                              );

                              return (
                                <MenuItem
                                  key={`${year}-${month}`}
                                  value={month}
                                >
                                  {monthName}
                                  {isCurrent && " (Current)"}
                                  {showYear && ` (${year})`}
                                </MenuItem>
                              );
                            },
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    md={1}
                    sx={{ mt: 0, display: "flex", justifyContent: "flex-end" }}
                  >
                    {!isReportValid ? (
                      <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                          const errors = await formik.validateForm();
                          const hasErrors = Object.values(errors).some(
                            (val) =>
                              (Array.isArray(val) &&
                                val.some(
                                  (item) =>
                                    item && Object.keys(item).length > 0,
                                )) ||
                              (!Array.isArray(val) && val),
                          );

                          if (!hasErrors) {
                            await handleContinue(formik.values);
                          }
                        }}
                        disabled={
                          !formik.values.unitNumber ||
                          !formik.values.year ||
                          !formik.values.month ||
                          isChecking
                        }
                        sx={{
                          minWidth: 120,
                          textTransform: "none",
                          fontWeight: 500,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          "&:hover": {
                            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                          },
                        }}
                      >
                        {isChecking ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Verify & Continue"
                        )}
                      </Button>
                    ) : (
                      <CheckCircleOutline />
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {showJurisdictions && (
              <Grid item xs={12} md={8}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 4,
                    mt: 3,
                    borderRadius: 2,
                    backgroundColor: "background.paper",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <Box
                    sx={{
                      mb: 4,
                      pb: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "text.primary" }}
                    >
                      Jurisdictions and Report
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add states and their corresponding fuel data
                    </Typography>
                  </Box>
                  {formik.values.stateEntries?.map((entry, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 1,
                        borderRadius: 1,
                        backgroundColor: "background.paper",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      <Grid
                        container
                        spacing={2}
                        alignItems="flex-end"
                        sx={{ p: 0.2 }}
                      >
                        <Grid item xs={12} sm={4}>
                          <Autocomplete
                            id={`state-${index}`}
                            options={states}
                            size="small"
                            getOptionLabel={(option) =>
                              typeof option === "string"
                                ? option
                                : `${option.code} - ${option.name}`
                            }
                            value={
                              states.find((s) => s.code === entry.state) || null
                            }
                            onChange={(_, newValue) => {
                              formik.setFieldValue(
                                `stateEntries.${index}.state`,
                                newValue ? newValue.code : "",
                              );
                            }}
                            renderInput={(params) => {
                              const { key, ...paramsWithoutKey } = params;
                              return (
                                <TextField
                                  {...paramsWithoutKey}
                                  label="State"
                                  error={
                                    formik.touched.stateEntries?.[index]
                                      ?.state &&
                                    Boolean(
                                      formik.errors.stateEntries?.[index]
                                        ?.state,
                                    )
                                  }
                                  helperText={
                                    formik.touched.stateEntries?.[index]
                                      ?.state &&
                                    formik.errors.stateEntries?.[index]?.state
                                  }
                                />
                              );
                            }}
                            renderOption={(props, option) => (
                              <li {...props} key={option.code}>
                                {`${option.code} - ${option.name}`}
                              </li>
                            )}
                            isOptionEqualToValue={(option, value) => {
                              if (!option || !value) return false;
                              const optionCode =
                                typeof option === "object"
                                  ? option.code
                                  : option;
                              const valueCode =
                                typeof value === "object" ? value.code : value;
                              return optionCode === valueCode;
                            }}
                            fullWidth
                            disableClearable
                            blurOnSelect
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Miles"
                            name={`stateEntries.${index}.miles`}
                            type="number"
                            value={entry.miles}
                            size="small"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (isNaN(value) || value >= 0) {
                                formik.handleChange(e);
                              }
                            }}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.stateEntries?.[index]?.miles &&
                              Boolean(
                                formik.errors.stateEntries?.[index]?.miles,
                              )
                            }
                            helperText={
                              formik.touched.stateEntries?.[index]?.miles &&
                              formik.errors.stateEntries?.[index]?.miles
                            }
                            inputProps={{ min: 0, step: "0.01" }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Gallons"
                            name={`stateEntries.${index}.gallons`}
                            type="number"
                            value={entry.gallons === 0 ? "0" : entry.gallons}
                            size="small"
                            onChange={(e) => {
                              const value = e.target.value === "0" ? "0" : e.target.value;
                              if (
                                value === "" ||
                                /^\d*\.?\d{0,3}$/.test(value)
                              ) {
                                formik.setFieldValue(e.target.name, value);
                              }
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value);
                              if (isNaN(value) || value >= 0) {
                                formik.handleChange(e);
                              }
                              if (!isNaN(value)) {
                                formik.setFieldValue(
                                  e.target.name,
                                  value.toFixed(3),
                                );
                              }
                              formik.handleBlur(e);
                            }}
                            error={
                              formik.touched.stateEntries?.[index]?.gallons &&
                              Boolean(
                                formik.errors.stateEntries?.[index]?.gallons,
                              )
                            }
                            helperText={
                              formik.touched.stateEntries?.[index]?.gallons &&
                              formik.errors.stateEntries?.[index]?.gallons
                            }
                            inputProps={{ min: 0, step: "0.001" }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={1} sx={{ textAlign: "center" }}>
                          <IconButton
                            color="error"
                            onClick={() => {
                              const newEntries = [
                                ...formik.values.stateEntries,
                              ];
                              newEntries.splice(index, 1);
                              formik.setFieldValue("stateEntries", newEntries);
                            }}
                            disabled={formik.values.stateEntries.length <= 1}
                            aria-label="remove jurisdiction"
                            size="small"
                            sx={{
                              transition: "all 0.2s",
                              "&:hover": {
                                transform: "scale(1.2)",
                                backgroundColor: "rgba(211, 47, 47, 0.08)",
                              },
                            }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}

                  <Button
                    variant="outlined"
                    size="medium"
                    onClick={() => {
                      formik.setFieldValue("stateEntries", [
                        ...(formik.values.stateEntries || []),
                        { state: "", miles: "", gallons: "" },
                      ]);
                    }}
                    startIcon={<AddIcon />}
                    sx={{
                      mt: 1,
                      textTransform: "none",
                      fontWeight: 500,
                      "&:hover": {
                        borderWidth: "1.5px",
                      },
                    }}
                  >
                    Add Another State
                  </Button>
                </Paper>
              </Grid>
            )}

            {showJurisdictions && (
              <Grid item xs={12} md={8}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 4,
                    mt: 3,
                    borderRadius: 2,
                    backgroundColor: "background.paper",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 2, fontWeight: 500 }}
                    >
                      Additional Notes (Optional)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Add any additional notes or comments here..."
                      variant="outlined"
                      name="notes"
                      value={formik.values.notes || ""}
                      onChange={formik.handleChange}
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: "primary.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderWidth: "1px",
                          },
                        },
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      mt: 4,
                      pt: 3,
                      borderTop: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}
                    >
                      Supporting Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload receipts or other supporting documents (PDF, JPG,
                      PNG)
                    </Typography>
                  </Box>

                  {/* Existing Attachments */}
                  {existingAttachments.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 2, fontWeight: 500 }}
                      >
                        Existing Files ({existingAttachments.length})
                      </Typography>
                      <Grid container spacing={1.5}>
                        {existingAttachments.map((attachment) => (
                          <Grid item key={attachment.id} xs={12} sm={6}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                p: 1.5,
                                bgcolor: "background.paper",
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "divider",
                                position: "relative",
                                transition: "all 0.2s",
                                "&:hover": {
                                  borderColor: "primary.main",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                },
                                "&:hover .file-actions": {
                                  opacity: 1,
                                  visibility: "visible",
                                  transform: "translateY(0)",
                                },
                              }}
                            >
                              {attachment.file_type === "application/pdf" ? (
                                <PictureAsPdfIcon
                                  color="error"
                                  sx={{ mr: 1, flexShrink: 0 }}
                                />
                              ) : attachment.file_type?.startsWith("image/") ? (
                                <ImageIcon
                                  color="primary"
                                  sx={{ mr: 1, flexShrink: 0 }}
                                />
                              ) : (
                                <InsertDriveFileIcon
                                  color="action"
                                  sx={{ mr: 1, flexShrink: 0 }}
                                />
                              )}
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                  variant="caption"
                                  component="div"
                                  noWrap
                                  sx={{
                                    display: "block",
                                    fontWeight: "medium",
                                  }}
                                >
                                  {attachment.file_name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  component="div"
                                >
                                  {(attachment.file_size / 1024).toFixed(1)} KB
                                </Typography>
                              </Box>
                              <Box
                                className="file-actions"
                                sx={{
                                  display: "flex",
                                  ml: 1,
                                  opacity: 0,
                                  visibility: "hidden",
                                  transform: "translateY(5px)",
                                  transition: "all 0.2s ease-in-out",
                                }}
                              >
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="View file">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Ensure there's no double slash between API URL and file path
                                        const baseUrl = process.env.REACT_APP_API_URL?.endsWith('/')
                                          ? process.env.REACT_APP_API_URL.slice(0, -1)
                                          : process.env.REACT_APP_API_URL;
                                        const filePath = attachment.file_path?.startsWith('/')
                                          ? attachment.file_path.substring(1)
                                          : attachment.file_path;
                                        const fileUrl = `${baseUrl}/${filePath}`;
                                        console.log('Opening file URL:', fileUrl);
                                        window.open(fileUrl, '_blank');
                                      }}
                                      sx={{
                                        color: "primary.main",
                                        "&:hover": {
                                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                                        },
                                      }}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Remove file">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeExistingAttachment(attachment.id);
                                      }}
                                      sx={{
                                        color: "error.main",
                                        "&:hover": {
                                          backgroundColor: "rgba(211, 47, 47, 0.08)",
                                        },
                                      }}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      {attachmentsToRemove.length > 0 && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 1, display: "block" }}
                        >
                          {attachmentsToRemove.length} file(s) will be removed
                          upon saving
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Box
                    sx={{
                      mt: 2,
                      "&:hover .upload-area": {
                        borderColor: "primary.main",
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <input
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: "none" }}
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={(e) => {
                        handleFileUpload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    <label htmlFor="file-upload">
                      <Box
                        className="upload-area"
                        sx={{
                          p: 4,
                          border: "2px dashed",
                          borderColor: "divider",
                          borderRadius: 1,
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          backgroundColor: "background.paper",
                          "&:hover": {
                            borderColor: "primary.main",
                            backgroundColor: "action.hover",
                            "& .upload-icon": {
                              transform: "translateY(-5px)",
                            },
                          },
                        }}
                      >
                        <Box
                          className="upload-icon"
                          sx={{ transition: "transform 0.3s ease" }}
                        >
                          <UploadFileIcon
                            color="action"
                            sx={{
                              fontSize: 48,
                              mb: 2,
                              color: "primary.main",
                              opacity: 0.8,
                            }}
                          />
                        </Box>
                        <Typography
                          variant="subtitle1"
                          gutterBottom
                          sx={{ fontWeight: 500 }}
                        >
                          Your files here
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          click and choose your files
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Supported formats: PDF, JPG, PNG (Max 10MB)
                        </Typography>

                        {uploadedFiles.length > 0 && (
                          <Box sx={{ mt: 3 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                mb: 1.5,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <InsertDriveFileIcon
                                color="primary"
                                fontSize="small"
                                sx={{ mr: 1 }}
                              />
                              {uploadedFiles.length} file
                              {uploadedFiles.length !== 1 ? "s" : ""} selected
                            </Typography>
                            <Grid container spacing={1.5}>
                              {uploadedFiles.map((fileData) => (
                                <Grid item key={fileData.id} xs={12} sm={6}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      p: 1.5,
                                      bgcolor: "background.paper",
                                      borderRadius: 1,
                                      border: "1px solid",
                                      borderColor: "divider",
                                      position: "relative",
                                      transition: "all 0.2s",
                                      "&:hover": {
                                        borderColor: "primary.main",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                      },
                                      "&:hover .file-actions": {
                                        opacity: 1,
                                        visibility: "visible",
                                        transform: "translateY(0)",
                                      },
                                    }}
                                  >
                                    {fileData.preview ? (
                                      <ImageIcon
                                        color="primary"
                                        sx={{ mr: 1, flexShrink: 0 }}
                                      />
                                    ) : fileData.file.type ===
                                      "application/pdf" ? (
                                      <PictureAsPdfIcon
                                        color="error"
                                        sx={{ mr: 1, flexShrink: 0 }}
                                      />
                                    ) : (
                                      <InsertDriveFileIcon
                                        color="action"
                                        sx={{ mr: 1, flexShrink: 0 }}
                                      />
                                    )}
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Typography
                                        variant="caption"
                                        component="div"
                                        noWrap
                                        sx={{
                                          display: "block",
                                          fontWeight: "medium",
                                        }}
                                      >
                                        {fileData.file.name}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        component="div"
                                      >
                                        {(fileData.file.size / 1024).toFixed(1)}{" "}
                                        KB
                                      </Typography>
                                    </Box>
                                    <Box
                                      className="file-actions"
                                      sx={{
                                        display: "flex",
                                        ml: 1,
                                        opacity: 0,
                                        visibility: "hidden",
                                        transform: "translateY(5px)",
                                        transition: "all 0.2s ease-in-out",
                                      }}
                                    >
                                      <Tooltip title="Remove file">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(fileData.id);
                                          }}
                                          sx={{
                                            color: "error.main",
                                            "&:hover": {
                                              backgroundColor:
                                                "rgba(211, 47, 47, 0.08)",
                                            },
                                          }}
                                        >
                                          <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      {fileData.preview && (
                                        <Tooltip title="View">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Handle preview logic here
                                            }}
                                            sx={{
                                              color: "primary.main",
                                              "&:hover": {
                                                backgroundColor:
                                                  "rgba(25, 118, 210, 0.08)",
                                              },
                                            }}
                                          >
                                            <VisibilityIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                      </Box>
                    </label>
                  </Box>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12} md={3.6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  m: 1,
                  minHeight: "25%",
                  backgroundColor: "white",
                  shadow: "2px 20px 8px rgba(76, 76, 76, 0.08)",
                  position: { xs: "static", md: "fixed" },
                  width: { xs: "100%", md: "calc(25% - 24px)" },
                  right: { xs: 0, md: 16 },
                  top: { xs: "auto", md: 100 },
                  zIndex: 1,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Summary Repor
                </Typography>
                {formik.values.stateEntries?.length > 0 && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: "background.paper",
                      borderRadius: 1,
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            component="span"
                            color="text.secondary"
                          >
                            Average MPG
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            ...(() => {
                              const totalMiles =
                                formik.values.stateEntries.reduce(
                                  (sum, entry) =>
                                    sum + (parseFloat(entry.miles) || 0),
                                  0,
                                );
                              const totalGallons =
                                formik.values.stateEntries
                                  .reduce(
                                    (sum, entry) =>
                                      sum + (parseFloat(entry.gallons) || 0),
                                    0,
                                  )
                                  .toFixed(3) || 1;
                              const mpg =
                                Math.round((totalMiles / totalGallons) * 100) /
                                100; // Ensure exactly 2 decimal places

                              // Calculate color based on distance from 5 (optimal value)
                              const distanceFromOptimal = Math.abs(mpg - 5);
                              // Normalize to 0-1 range where 0 is optimal (5) and 1 is max distance (5+)
                              const normalized = Math.min(
                                distanceFromOptimal / 5,
                                1,
                              );
                              // Invert so 0 distance = green, max distance = red
                              const hue = ((1 - normalized) * 120).toString(10);

                              return {
                                color: `hsl(${hue}, 70%, 30%)`,
                                fontWeight: 600,
                              };
                            })(),
                          }}
                        >
                          <Typography variant="h5">
                            {(
                              formik.values.stateEntries.reduce(
                                (sum, entry) =>
                                  sum + (parseFloat(entry.miles) || 0),
                                0,
                              ) /
                              (formik.values.stateEntries.reduce(
                                (sum, entry) =>
                                  sum + (parseFloat(entry.gallons) || 0),
                                0,
                              ) || 1)
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Box>
                        <br />
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">
                            Total Miles:
                          </Typography>
                          <Typography variant="h5" color="primary">
                            {Math.round(
                              formik.values.stateEntries.reduce(
                                (sum, entry) =>
                                  sum + (parseFloat(entry.miles) || 0),
                                0,
                              ),
                            ).toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Total Gallons:
                        </Typography>
                        <Typography variant="h5" color="primary">
                          {parseFloat(
                            formik.values.stateEntries
                              .reduce(
                                (sum, entry) =>
                                  sum + (parseFloat(entry.gallons) || 0),
                                0,
                              )
                              .toFixed(3),
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 3,
                          })}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <Box
                  sx={{
                    mt: 3,
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(120px, 1fr))" },
                    gap: 2,
                    width: "100%",
                    maxWidth: "500px"
                  }}
                >


                  <Button
                    title="Back to Review & Changes"
                    component={RouterLink}
                    to={
                      currentUser?.role === "admin"
                        ? "/admin/consumption"
                        : "/client/consumption"
                    }
                    variant="outlined"
                    size="medium"
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    title="Delete Report"
                    variant="contained"
                    color="error"
                    onClick={handleDeleteClick}
                    disabled={isDeleting || isLoading}
                    size="medium"
                    fullWidth
                    startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>

                  <Button
                    title={reportStatus === 'in_progress' ? 'Switch to Draft' : 'Save'}
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      setSubmitStatus("sent");
                      handleOpenSave();
                    }}
                    disabled={!isFormValid()}
                    size="medium"
                    fullWidth
                    startIcon={<Save />}
                  >
                    {reportStatus === 'in_progress' ? 'Switch to Draft' : 'Save'}
                  </Button>

                  <Button
                    title={reportStatus === 'in_progress' ? 'Update Report' : 'Submit Report'}
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setSubmitStatus("in_progress");
                      handleOpenSubmit();
                    }}
                    disabled={!isFormValid() || !isReportValid || isLoading}
                    size="medium"
                    fullWidth
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                  >
                    {isLoading ? "Updating..." : reportStatus === 'sent' ? 'Submit' : 'Update Report'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </form>

        <Dialog open={open} onClose={handleCloseSave}>
          <DialogContent>
            <Typography>
              {reportStatus === 'in_progress' ? 'Are you sure? This action changes your report to Draft.' : 'Are you sure? This action saves the changes to the report.'}

            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSave}>Cancel</Button>
            <Button
              sx={{ color: "white" }}
              type="submit"
              form="myForm"
              variant="contained"
              color="success"
            >
              {reportStatus === 'in_progress' ? 'Switch to Draft' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={submitDialogOpen} onClose={handleCloseSubmit}>
          <DialogContent>
            <Typography>
              {reportStatus === 'sent' ? 'Are you sure? This option will send your information for transmission to IFTA.' : 'Are you sure? This action updates your report.'}

            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSubmit}>Cancel</Button>
            <Button
              sx={{ color: "white" }}
              type="submit"
              form="myForm"
              variant="contained"
              color="primary"
            >
              {reportStatus === 'sent' ? 'Submit' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            Delete Report
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to <b>DELETE</b> this report? <br />You can't undo this action.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Box sx={{ display: "flex", width: "100%", justifyContent: "center", gap: 6 }}>
              <Button
                onClick={handleDeleteConfirm}
                color="error"
                autoFocus
                disabled={isDeleting}
                startIcon={isDeleting ? <CircularProgress size={20} /> : null}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
              <Button onClick={handleDeleteCancel}
                color="primary"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </Box>
          </DialogActions>
      </Dialog>
    </Box>
    </LocalizationProvider >
  );
};

export default ConsumptionEdit;
