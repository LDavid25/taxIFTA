import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

const SummaryCard = ({ title, value, icon, color = 'primary', subtext }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="text.secondary">{title}</Typography>
          <Avatar sx={{ bgcolor: `${color}.main` }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
          {value}
        </Typography>
        {subtext && (
          <Typography variant="body2" color="text.secondary">
            {subtext}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
