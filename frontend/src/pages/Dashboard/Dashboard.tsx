import React from 'react';
import { Box, Typography } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Welcome to Project Chimera! Your AI Builder System dashboard is coming soon.
      </Typography>
    </Box>
  );
};

export default Dashboard;
