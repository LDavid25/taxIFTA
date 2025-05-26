import React from 'react';
import { Alert, AlertTitle, Collapse, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const AlertMessage = ({ 
  open, 
  onClose, 
  severity = 'info', 
  title, 
  message,
  autoHideDuration = null 
}) => {
  // Auto-ocultar la alerta después de un tiempo determinado
  React.useEffect(() => {
    if (open && autoHideDuration) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  return (
    <Collapse in={open}>
      <Alert
        severity={severity}
        action={
          onClose ? (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={onClose}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          ) : null
        }
        sx={{ mb: 2 }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Collapse>
  );
};

export default AlertMessage;
