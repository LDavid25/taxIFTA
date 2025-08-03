import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper,
  Alert,
  Snackbar,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Divider
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../services/api';

const RegisterUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companies, setCompanies] = useState([]);
  const [companyOption, setCompanyOption] = useState('existing'); // 'existing' or 'new'
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password123!', // Default password for new users
    role: 'user',
    company_id: '',
    company: {
      name: '',
      company_email: '',
      phone: '',
      distribution_emails: ['']
    }
  });

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/v1/companies');
        setCompanies(response.data.data || []);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Error loading companies');
      }
    };
    
    fetchCompanies();
  }, []);

  // Update company option when role changes
  useEffect(() => {
    if (formData.role === 'admin') {
      setCompanyOption('none');
    } else if (companyOption === 'none') {
      setCompanyOption('existing');
    }
  }, [formData.role, companyOption]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('company.')) {
      const companyField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          [companyField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDistributionEmailChange = (index, value) => {
    const newEmails = [...formData.company.distribution_emails];
    newEmails[index] = value;
    
    // Add new empty field if this is the last one and it's not empty
    if (index === newEmails.length - 1 && value && newEmails.length < 10) {
      newEmails.push('');
    }
    
    setFormData(prev => ({
      ...prev,
      company: {
        ...prev.company,
        distribution_emails: newEmails
      }
    }));
  };

  const addDistributionEmail = () => {
    if (formData.company.distribution_emails.length < 10) {
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          distribution_emails: [...prev.company.distribution_emails, '']
        }
      }));
    }
  };

  const removeDistributionEmail = (index) => {
    if (formData.company.distribution_emails.length > 1) {
      const newEmails = formData.company.distribution_emails.filter((_, i) => i !== index);
      // Ensure at least one empty field remains if we're removing the last one
      if (newEmails.every(email => email.trim() === '')) {
        newEmails[0] = '';
      }
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          distribution_emails: newEmails
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare the request data
      const requestData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        password_confirmation: formData.password,
        role: formData.role,
      };

      // Add company data based on selection
      if (formData.role !== 'admin') {
        if (companyOption === 'existing' && formData.company_id) {
          // When using an existing company, only send company_id
          requestData.company_id = formData.company_id;
          // Clear any company-related fields to avoid validation issues
          delete requestData.company_name;
          delete requestData.company_phone;
          delete requestData.company_email;
          delete requestData.company_distribution_emails;
        } else if (companyOption === 'new') {
          // When creating a new company, send all company fields
          requestData.company_name = formData.company.name.trim();
          requestData.company_phone = formData.company.phone.trim();
          requestData.company_email = formData.company.company_email.trim().toLowerCase();
          requestData.company_distribution_emails = formData.company.distribution_emails
            .filter(email => email.trim() !== '')
            .map(email => email.trim().toLowerCase());
          // Clear company_id to avoid conflicts
          delete requestData.company_id;
        } else {
          throw new Error('Please select an existing company or create a new one');
        }
      }
      
      console.log('Sending registration data:', JSON.stringify(requestData, null, 2));
      
      // Ensure we're sending the correct content type
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const response = await api.post('/v1/auth/register', requestData, config);
      
      if (response.data && response.data.token) {
        setSuccess('');
        // Reset form on success
        setFormData({
          name: '',
          email: '',
          password: 'Password123!',
          role: 'user',
          company_id: '',
          company: {
            name: '',
            company_email: '',
            phone: '',
            distribution_emails: ['']
          }
        });
        setCompanyOption('existing');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Error registering the user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Register New User
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                User Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="text"
                value={formData.password}
                onChange={handleChange}
                required
                margin="normal"
                helperText="Password must be at least 8 characters long, including uppercase, lowercase, numbers, and special characters"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role"
                  required
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.role !== 'admin' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Company Information
                </Typography>
                
                <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                  <FormLabel component="legend">Select an option:</FormLabel>
                  <RadioGroup 
                    row 
                    value={companyOption}
                    onChange={(e) => setCompanyOption(e.target.value)}
                  >
                    <FormControlLabel 
                      value="existing" 
                      control={<Radio />} 
                      label="Select existing company" 
                    />
                    <FormControlLabel 
                      value="new" 
                      control={<Radio />} 
                      label="Create new company" 
                    />
                  </RadioGroup>
                </FormControl>

                {companyOption === 'existing' && (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Company</InputLabel>
                    <Select
                      value={formData.company_id}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        company_id: e.target.value
                      }))}
                      label="Company"
                      required
                    >
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name} ({company.contact_email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {companyOption === 'new' && (
            
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Company Name"
                        name="company.name"
                        value={formData.company.name}
                        onChange={handleChange}
                        required={companyOption === 'new'}
                        margin="normal"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Company Email"
                        name="company.company_email"
                        type="email"
                        value={formData.company.company_email}
                        onChange={handleChange}
                        required={companyOption === 'new'}
                        margin="normal"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Company Phone"
                        name="company.phone"
                        value={formData.company.phone}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                  </>
                )}
            
                {companyOption === 'new' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Distribution Emails (Optional, maximum 10)
                    </Typography>
                    
                    {formData.company.distribution_emails.map((email, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <TextField
                          fullWidth
                          type="email"
                          value={email}
                          onChange={(e) => handleDistributionEmailChange(index, e.target.value)}
                          margin="normal"
                          size="small"
                          placeholder="email@example.com"
                        />
                        {formData.company.distribution_emails.length > 1 && (
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            onClick={() => removeDistributionEmail(index)}
                            sx={{ minWidth: '100px' }}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    ))}
                    
                    <Button 
                      variant="outlined" 
                      onClick={addDistributionEmail}
                      disabled={formData.company.distribution_emails.length >= 10}
                      sx={{ mt: 1 }}
                      startIcon={<AddIcon />}
                    >
                      Add Email
                    </Button>
                  </Grid>
                )}
                </Grid>
              )}

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
                fullWidth
                size="large"
                sx={{ py: 1.5 }}
              >
                {loading ? 'Registering...' : 'Register User'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default RegisterUser;
