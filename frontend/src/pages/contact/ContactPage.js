import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import {
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import { Send, ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';  
import { Link } from '@mui/material'; 

const ContactPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Configuración de EmailJS
    const serviceID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateID = process.env.REACT_APP_EMAILJS_TEMPLATE_CREATE_ACCOUNT;
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
    
    try {
      await emailjs.send(
        serviceID,
        templateID,
        {
          to_name: `${formData.firstName} ${formData.lastName}`,
          from_name: 'Dot Truck Permits',
          reply_to: formData.email,
          message: `
            Name: ${formData.firstName} ${formData.lastName}
            Email: ${formData.email}
            Phone: ${formData.phone}
            Company: ${formData.company}
            Message: ${formData.message}
          `,
          phone: formData.phone,
          company: formData.company
        },
        publicKey
      );

      setSnackbarMessage('Message sent successfully! We will get back to you soon.');
      setSnackbarSeverity('success');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        message: ''
      });
    } catch (error) {
      console.error('Error al enviar el mensaje:', error);
      setSnackbarMessage('Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        width: '98.9vw',
        minHeight: '95vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        bgcolor: 'background.default',
        p: 0,
        m: 0,
      }}
    >
      {/* Left Section - Content */}
      <Box
        sx={{
          width: isMobile ? '100%' : '50%',
          p: { xs: 4, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: 'primary.gray',
          color: 'text.primary',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: 'text.primary',
            '& a': {
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
          }}
        >
          <Link component={RouterLink} to="/Login" color="inherit">
          <ArrowBack/>
            Back to Login
          </Link>
        </Typography>
        <Typography
          variant="h3"
          component="h3"
          sx={{
            fontWeight: 700,
            mb: 3,
            fontSize: { xs: '1.5rem', md: '2rem' },
            lineHeight: 1.2,
            color: 'text.primary',
          }}
        >
          Talk to our Account expert
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontSize: '1.1rem',
            opacity: 0.9,
            mb: 4,
            maxWidth: '90%',
            lineHeight: 1.6,
            color: 'text.primary',
          }}
        >
          We are Dot Truck Permits, authorized agents here to assist you with your IFTA filling. Please complete the form bellow, and one of our representatives will contact you to help register on our IFTA Reporting plataform.
        </Typography>


      </Box>

      {/* Right Section - Form */}
      <Box
        sx={{
          width: isMobile ? '100%' : '50%',
          p: { xs: 4, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          boxShadow: '0px 3px 5px rgba(0,0,0,0.1)'
        }}
      >
        <Typography
          variant="p"
          component="p"
          sx={{
            fontWeight: 700,
            mb: 4,
            color: 'text.primary'
          }}
        >
          Fill the form below to request an account

        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="firstName"
                label="First Name"
                variant="outlined"
                size="small"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="lastName"
                label="Last Name"
                variant="outlined"
                size="small"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="email"
                label="Email"
                type="email"
                variant="outlined"
                size="small"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="phone"
                label="Phone Number"
                type="tel"
                variant="outlined"
                size="small"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="company"
                label="Company Name"
                variant="outlined"
                size="small"
                value={formData.company}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="message"
                label="Any message you want to share with us…"
                multiline
                rows={6}
                variant="outlined"
                value={formData.message}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                endIcon={<Send />}
                disabled={isSubmitting}
                sx={{
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  borderRadius: 2,
                  boxShadow: 'none',
                  backgroundColor: 'btn.main',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'action.disabledBackground',
                    color: 'action.disabled'
                  }
                }}
              >
                {isSubmitting ? 'Enviando...' : 'Send Message'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactPage;