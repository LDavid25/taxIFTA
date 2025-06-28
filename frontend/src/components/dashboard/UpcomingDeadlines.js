import React from 'react';
import { Paper, List, ListItem, ListItemText, Typography, Box, Chip } from '@mui/material';
import { format, addMonths, startOfQuarter, endOfQuarter, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

const getNextQuarters = (count = 4) => {
  const quarters = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const quarterStart = startOfQuarter(today);
    const quarterEnd = endOfQuarter(today);
    const quarterNumber = Math.floor(quarterStart.getMonth() / 3) + 1;
    
    // Solo agregar si el trimestre actual o futuro
    if (i > 0 || isAfter(quarterEnd, today)) {
      quarters.push({
        id: i,
        name: `T${quarterNumber} ${quarterStart.getFullYear()}`,
        startDate: quarterStart,
        endDate: quarterEnd,
        dueDate: addMonths(quarterEnd, 1) // Fecha de vencimiento: 1 mes después del trimestre
      });
    }
    
    // Mover al inicio del próximo trimestre
    today.setMonth(today.getMonth() + 3);
  }
  
  return quarters;
};

const UpcomingDeadlines = () => {
  const quarters = getNextQuarters(4);
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Próximos Vencimientos
      </Typography>
      <List dense>
        {quarters.map((quarter) => (
          <ListItem key={quarter.id} divider>
            <ListItemText
              primary={quarter.name}
              secondary={`Vence: ${format(quarter.dueDate, 'dd MMM yyyy', { locale: es })}`}
            />
            <Chip 
              label="Pendiente" 
              color="warning" 
              size="small"
              variant="outlined"
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Fechas de presentación IFTA
        </Typography>
      </Box>
    </Paper>
  );
};

export default UpcomingDeadlines;
