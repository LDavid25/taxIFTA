import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress, 
  Alert, 
  Box,
  Breadcrumbs,
  Link,
  Button
} from '@mui/material';
import { Home as HomeIcon, People as PeopleIcon } from '@mui/icons-material';
import { getUserById, updateUser } from '../../services/userService';
import { useSnackbar } from 'notistack';
import UserEditForm from '../../components/UserEditForm';

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await getUserById(id);
        // Asegurarse de que estamos usando la estructura correcta de la respuesta
        const userData = response?.data || response;
        console.log('Datos del usuario cargados:', userData);
        
        // Asegurarse de que el objeto de usuario tenga todos los campos necesarios
        const formattedUser = {
          id: userData.id,
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || 'user',
          is_active: userData.is_active !== undefined ? userData.is_active : true,
          // Incluir cualquier otro campo que pueda necesitar el formulario
          ...userData
        };
        
        setUser(formattedUser);
      } catch (err) {
        console.error('Error al cargar el usuario:', err);
        setError('No se pudo cargar la información del usuario');
        enqueueSnackbar('Error al cargar el usuario', { 
          variant: 'error',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, enqueueSnackbar]);

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      
      // Crear un objeto con solo los campos que necesitamos actualizar
      const userData = {
        name: values.name,
        email: values.email,
        is_active: values.is_active
      };
      
      // Solo agregar la contraseña si se proporcionó una nueva
      if (values.password) {
        userData.password = values.password;
      }
      
      await updateUser(id, userData);
      
      enqueueSnackbar('Usuario actualizado correctamente', { 
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
      
      // Actualizar los datos locales del usuario
      setUser((prev) => ({
        ...prev,
        ...values
      }));
      
    } catch (err) {
      console.error('Error al actualizar el usuario:', err);
      const errorMessage = err.response?.data?.message || 'Error al actualizar el usuario';
      
      enqueueSnackbar(errorMessage, { 
        variant: 'error',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
      
      throw err; // Permitir que el formulario maneje el error
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleBack}
        >
          Volver atrás
        </Button>
      </Container>
    );
  }

  // User data is now properly handled by the form component

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            underline="hover"
            color="inherit"
            href="/admin"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Inicio
          </Link>
          <Link
            underline="hover"
            color="inherit"
            href="/admin/users"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <PeopleIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Users 
          </Link>
          <Typography color="text.primary">
            {user ? `Edit ${user.name}` : 'Edit User'}
          </Typography>
        </Breadcrumbs>

        <Card>
          <CardContent>
            <Typography variant="h5" component="h1" gutterBottom>
              {user ? `Edit User: ${user.name}` : 'Edit User'}
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : user ? (
              <UserEditForm
                key={user.id} // Add key to force re-render when user changes
                user={user}
                onSubmit={handleSubmit}
                loading={saving}
              />
            ) : (
              <Alert severity="warning">No user data found</Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default EditUserPage;
