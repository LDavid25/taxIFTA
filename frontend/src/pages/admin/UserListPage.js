import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Grid, 
  TextField, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  TablePagination,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { getUsers, updateUserStatus, getCurrentUser } from '../../services/userService';
import Chip from '@mui/material/Chip';


const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York'
  });
};

const UserListPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // Estados para la lista de usuarios y paginación
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Manejador de cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Manejador de cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Volver a la primera página al cambiar el tamaño
  };

  // Manejador de búsqueda
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reiniciar a la primera página al buscar
  };

  // Filtrar usuarios localmente por término de búsqueda
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return users;
    
    const searchLower = searchQuery.toLowerCase();
    return users.filter(user => {
      return (
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.role && user.role.toLowerCase().includes(searchLower))
      );
    });
  }, [users, searchQuery]);

  // Calcular las filas para la página actual
  const paginatedUsers = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  // Función para cargar los usuarios
  const fetchUsers = async (currentPage = page, currentLimit = rowsPerPage, search = searchQuery) => {
    try {
      setLoading(true);
      setError('');
      
      // Ajustar el número de página para la API (que empieza en 1)
      const apiPage = currentPage + 1;
      
      const result = await getUsers(apiPage, currentLimit, search);
      
      // Formatear los usuarios según la respuesta esperada
      let formattedUsers = [];
      let total = 0;
      
      if (result && Array.isArray(result.users)) {
        formattedUsers = result.users;
        total = result.total || result.users.length;
      } else if (Array.isArray(result)) {
        formattedUsers = result;
        total = result.length;
      }
      
      setUsers(formattedUsers);
      setTotalUsers(total);
      
      // Mostrar un mensaje si no hay resultados
      if (formattedUsers.length === 0) {
        enqueueSnackbar('No se encontraron usuarios', { variant: 'info' });
      }
      
      return formattedUsers;
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar la lista de usuarios. Por favor, intente de nuevo.');
      enqueueSnackbar('Error al cargar la lista de usuarios', { variant: 'error' });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de la API
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, searchQuery, enqueueSnackbar]);

  // Función para manejar el cambio de estado
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [userId]: true }));
      
      // Actualizar el estado en el servidor
      const response = await updateUserStatus(userId, !currentStatus);
      
      // Actualizar el estado local independientemente de la respuesta del servidor
      // ya que sabemos que el cambio se realizó correctamente en la base de datos
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, is_active: !currentStatus }
            : user
        )
      );
      
      enqueueSnackbar(
        `Usuario ${!currentStatus ? 'activado' : 'desactivado'} correctamente`, 
        { variant: 'success' }
      );
      
      // Recargar los datos del servidor para asegurar consistencia
      await fetchUsers();
    } catch (error) {
      console.error('Error al actualizar el estado del usuario:', error);
      
      // Mostrar mensaje de error específico si está disponible
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      enqueueSnackbar(
        `Error al ${currentStatus ? 'desactivar' : 'activar'} el usuario: ${errorMessage}`, 
        { variant: 'error' }
      );
      
      // Recargar la lista de usuarios para asegurar consistencia
      fetchUsers();
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Función para renderizar el switch de estado
  const renderStatusSwitch = (user) => {
    if (!user) return null;
    
    return (
      <Box onClick={(e) => e.stopPropagation()}>
        <FormControlLabel
          control={
            <Switch
              checked={user.is_active || false}
              onChange={(e) => {
                e.stopPropagation();
                handleToggleStatus(user.id, user.is_active);
              }}
              disabled={updatingStatus[user.id]}
              color="primary"
              inputProps={{ 'aria-label': 'user status switch' }}
            />
          }
          label={
            <Box component="span" ml={1}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Box>
          }
          labelPlacement="end"
        />
      </Box>
    );
  };

  // Mostrar carga
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                User Management
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Manage system users and their permissions
              </Typography>

              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar usuarios por nombre o email..."
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow 
                        key={user.id} 
                        hover
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }}
                        sx={{ 
                          '&:hover': { 
                            cursor: 'default',
                            backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                          } 
                        }}
                        component="div"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                      >
                        <TableCell>{user.name || 'N/A'}</TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role || 'user'} 
                            color={user.role === 'admin' ? 'primary' : 'default'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{formatDate(user.last_login)}</TableCell>
                        <TableCell align="center">
                          {renderStatusSwitch(user)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={totalUsers}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="Usuarios por página:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserListPage;
