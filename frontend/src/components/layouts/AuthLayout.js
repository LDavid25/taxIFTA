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

const AuthLayout = () => {
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
          <Link component={RouterLink} to="/Login">
            <img src={logo} alt="Logotype DOT Truck Permits" width={`200px`} />
          </Link>
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            color="inherit"
            component="a"
            href="/Login"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Log In
          </Button>
          <Button
            color="inherit"
            component="a"
            href="/contact"
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            Request an account
          </Button>
          <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
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
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          py: 0
        }}
      >
        <Outlet />
      </Box>

      {/* Pie de página */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          textAlign: 'center',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} IFTA Easy Tax System. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;
