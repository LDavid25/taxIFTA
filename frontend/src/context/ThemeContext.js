import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';

// Crear el contexto
const ThemeContext = createContext();

// Hook personalizado para usar el contexto
export const useTheme = () => useContext(ThemeContext);

// Proveedor del contexto
export const ThemeProvider = ({ children }) => {
  // Obtener el modo del tema del localStorage o usar 'light' por defecto
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  // Actualizar el localStorage cuando cambie el modo
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Alternar entre modo claro y oscuro
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Crear el tema de Material-UI
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
            contrastText: '#fff',
          },
          secondary: {
            main: '#f50057',
            light: '#ff4081',
            dark: '#c51162',
            contrastText: '#fff',
          },
          text: {
            primary: '#212121',
            secondary: '#757575',
            disabled: '#9e9e9e',
            hint: '#9e9e9e',
          },
          error: {
            main: '#f44336',
          },
          warning: {
            main: '#ff9800',
          },
          info: {
            main: '#2196f3',
          },
          success: {
            main: '#4caf50',
          },
          btn: {
            main: '#212121',
          },
          background: {
            default: mode === 'light' ? '#f9fafb' : '#121212',
            paper: mode === 'light' ? '#fff' : '#1e1e1e',
          },
        },
        typography: {
          fontFamily: [
            'Inter',
            'sans-serif',
          ].join(','),
          h1: {
            fontSize: '2.5rem',
            fontWeight: 500,
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 500,
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
          },
          h6: {
            fontSize: '1rem',
            fontWeight: 500,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'light' 
                  ? '0px 2px 4px rgba(0, 0, 0, 0.1)' 
                  : '0px 2px 4px rgba(0, 0, 0, 0.3)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'light' 
                  ? '0px 2px 4px rgba(0, 0, 0, 0.1)' 
                  : '0px 2px 4px rgba(0, 0, 0, 0.3)',
              },
            },
          },
        },
      }),
    [mode]
  );

  // Valores proporcionados por el contexto
  const value = {
    mode,
    theme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
