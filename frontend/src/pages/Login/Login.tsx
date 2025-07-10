import React from 'react';
import { Box, Typography } from '@mui/material';

interface LoginProps {}

const Login: React.FC<LoginProps> = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          p: 4,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Project Chimera
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" mb={3}>
          AI Builder System - Login
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          Login component coming soon...
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
