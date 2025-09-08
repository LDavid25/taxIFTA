import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { getCompanyById, updateCompany } from "../../services/companyService";

const CompanyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [company, setCompany] = useState({
    name: "",
    contact_email: "",
    phone: "",
    distribution_mail: [],
    emailInput: "", // Store raw input here
    is_active: true,
  });

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        console.log('Fetching company with ID:', id);
        const response = await getCompanyById(id);
        console.log('Company data received:', response);
        
        if (response && response.data) {
          const companyData = response.data;
          
          // Asegurarse de que los correos sean un array
          let emails = [];
          if (companyData.distribution_mail) {
            emails = Array.isArray(companyData.distribution_mail) 
              ? companyData.distribution_mail 
              : [companyData.distribution_mail];
          } else if (companyData.distribution_emails) {
            emails = Array.isArray(companyData.distribution_emails)
              ? companyData.distribution_emails
              : [companyData.distribution_emails];
          }
          
          console.log('Processed emails:', emails);
          
          setCompany({
            name: companyData.name || "",
            contact_email: companyData.contactEmail || companyData.contact_email || "",
            phone: companyData.phone || "",
            distribution_mail: emails,
            emailInput: emails.join(', '), // Inicializar el input con los correos
            is_active: companyData.status === "active" || companyData.is_active === true,
          });
        } else {
          console.error("Invalid response format:", response);
          throw new Error("Formato de respuesta inválido del servidor");
        }
      } catch (err) {
        console.error("Error fetching company:", {
          message: err.message,
          response: err.response?.data,
          stack: err.stack,
        });
        setError(
          "Error al cargar los datos de la compañía: " +
            (err.message || "Error desconocido"),
        );
        enqueueSnackbar("Error al cargar los datos de la compañía", {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompany();
    } else {
      setLoading(false);
    }
  }, [id, enqueueSnackbar]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCompany((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    // Solo actualizamos el valor del input cuando el usuario está escribiendo
    setCompany(prev => ({
      ...prev,
      emailInput: value
    }));
  };

  // Actualizar la lista de correos cuando el input pierde el foco
  const handleEmailBlur = () => {
    const emails = company.emailInput
      .split(',')
      .map(email => email.trim())
      .filter(email => email !== ''); // Filtrar correos vacíos
      
    const validEmails = [...new Set(emails.filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))];
    
    // Mostrar advertencia si hay correos inválidos
    if (emails.length > validEmails.length) {
      enqueueSnackbar('some emails are invalid and will not be saved', { variant: 'warning' });
    }
    
    // Actualizar tanto el emailInput como distribution_mail
    setCompany(prev => ({
      ...prev,
      emailInput: validEmails.join(', '),  // Actualizar con correos válidos formateados
      distribution_mail: validEmails       // Actualizar el array de correos
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Procesar los correos antes de enviar
      const emails = company.emailInput
        .split(',')
        .map(email => email.trim())
        .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      
      const uniqueEmails = [...new Set(emails)];
      
      // Preparar los datos para enviar al backend
      const companyData = {
        name: company.name,
        contactEmail: company.contact_email,
        phone: company.phone,
        distribution_mail: uniqueEmails,
        status: company.is_active ? "active" : "inactive",
      };
      
      console.log('Enviando datos al servidor:', companyData);
      
      console.log('=== SENDING COMPANY UPDATE ===');
      console.log('Company ID:', id);
      console.log('Request data:', JSON.stringify(companyData, null, 2));
      
      const response = await updateCompany(id, companyData);
      
      console.log('=== UPDATE SUCCESSFUL ===');
      console.log('Response:', response);

      enqueueSnackbar('Company updated successfully', { variant: 'success' });
      
      // Redirect back to companies list after successful update
      navigate('/admin/companies');
    } catch (err) {
      console.error("Error updating company:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "" ||
        err.message ||
        "Error al actualizar la compañía";

      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box mb={4}>
          <Typography variant="h5" component="h2" gutterBottom>
            {id ? "Edit Company" : "New Company"}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={company.name}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Email"
                name="contact_email"
                type="email"
                value={company.contact_email}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={company.phone}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notification emails (comma separated)"
                placeholder="email1@example.com, email2@example.com"
                value={company.emailInput || ''}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                helperText={company.distribution_mail?.length > 0 
                  ? `${company.distribution_mail.length} valid email(s) will be saved` 
                  : "Enter email addresses separated by commas"}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={company.is_active}
                    onChange={handleChange}
                    name="is_active"
                    color="primary"
                  />
                }
                label={company.is_active ? "Active" : "Inactive"}
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/admin/companies")}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : "Save Changes"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CompanyEdit;

