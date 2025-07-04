import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Typography,
  useTheme,
  IconButton,
  Tooltip,
  Button,
  Stack
} from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import logo from '../../assets/img/dtp-logo.png';
import { Link as RouterLink } from 'react-router-dom';
import { Link } from '@mui/material';

const AuthLayout = ({ children }) => {
  const theme = useTheme();
  const { mode, toggleTheme } = useAppTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Encabezado */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          <Link component={RouterLink} to="/login">
            <img src={logo} alt="Logotype DOT Truck Permits" width="200px" />
          </Link>
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={`Cambiar a modo ${mode === 'light' ? 'oscuro' : 'claro'}`}>
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
        }}
      >
        {children || <Outlet />}
      </Box>

      {/* Pie de página */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {new Date().getFullYear()} DOT Truck Permits. Todos los derechos reservados.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;
