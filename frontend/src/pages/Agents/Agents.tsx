import React from 'react';
import { Box, Typography } from '@mui/material';

const Agents: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Agents
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage your AI agents. Create, monitor, and control intelligent agents.
      </Typography>
    </Box>
  );
};

export default Agents;
