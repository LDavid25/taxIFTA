import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Ancho del drawer
const drawerWidth = 240;

// Componente estilizado para el contenido principal
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(2, 3, 3, 2), // Reduced left and right padding
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: drawerWidth/10,
    }),
  }),
);

// Componente estilizado para la barra de aplicación
const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// Componente estilizado para el encabezado del drawer
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const MainLayout = () => {
  const navigate = useNavigate();
  const { currentUser, logout, isAdmin } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  
  // Estado para controlar la apertura del drawer
  const [open, setOpen] = useState(!isMobile);
  
  // Estado para el menú de usuario
  const [anchorEl, setAnchorEl] = useState(null);
  const userMenuOpen = Boolean(anchorEl);
  
  // Manejar apertura del drawer
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  
  // Manejar cierre del drawer
  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  // Manejar apertura del menú de usuario
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Manejar cierre del menú de usuario
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Manejar cierre de sesión
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };
  
  // Manejar navegación al perfil
  const handleProfile = () => {
    handleUserMenuClose();
    const profilePath = isAdmin ? '/admin/profile' : '/client/profile';
    navigate(profilePath);
  };
  
  // Sidebar menu items
  const menuItems = [
    // Common items for all authenticated users
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: isAdmin ? '/admin/dashboard' : '/client/dashboard' 
    },
    { 
      text: 'Fuel Consumption History', 
      icon: <HistoryIcon />, 
      path: isAdmin ? '/admin/consumption' : '/client/consumption' 
    },
    { 
      text: 'Declarations', 
      icon: <DescriptionIcon />, 
      path: isAdmin ? '/admin/declarations' : '/client/declarations' 
    },
    
    // Admin-only items
    ...(isAdmin ? [
      { 
        text: 'Companies', 
        icon: <BusinessIcon />, 
        path: '/admin/companies' 
      },
      { 
        text: 'Register User', 
        icon: <PersonAddIcon />, 
        path: '/admin/register-user' 
      }
    ] : [])
  ];
  
  return (
    <Box sx={{ display: 'flex' }}>
      {/* Barra de aplicación */}
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open menu"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            IFTA Easy Tax System
          </Typography>
          
          {/* Avatar y menú de usuario */}
          <Tooltip title="Account Settings">
            <IconButton
              onClick={handleUserMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={userMenuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuOpen ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {currentUser?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={userMenuOpen}
            onClose={handleUserMenuClose}
            onClick={handleUserMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBarStyled>
      
      {/* Drawer lateral */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={open}
        onClose={handleDrawerClose}
      >
        <DrawerHeader>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Menu
          </Typography>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text} 
              component={Link} 
              to={item.path}
              onClick={isMobile ? handleDrawerClose : undefined}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem 
            button 
            component={Link} 
            to={isAdmin ? "/admin/profile" : "/client/profile"}
            onClick={isMobile ? handleDrawerClose : undefined}
          >
            <ListItemIcon><PersonIcon /></ListItemIcon>
            <ListItemText primary="My Profile" />
          </ListItem>
          
        </List>
      </Drawer>
      
      {/* Contenido principal */}
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
};

export default MainLayout;
