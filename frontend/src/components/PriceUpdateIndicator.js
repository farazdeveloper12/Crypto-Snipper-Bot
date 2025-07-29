// src/components/PriceUpdateIndicator.js
import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import UpdateIcon from '@mui/icons-material/Update';

const PriceUpdateIndicator = ({ lastUpdated }) => {
  if (!lastUpdated) {
    return null;
  }

  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diffMs = now - lastUpdated;
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
  };

  const isRecent = (new Date() - lastUpdated) < 30000; // 30 seconds

  return (
    <Tooltip title={`Last price update: ${lastUpdated.toLocaleTimeString()}`}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <UpdateIcon 
          fontSize="small" 
          sx={{ 
            color: isRecent ? 'success.main' : 'text.secondary',
            mr: 0.5,
            animation: isRecent ? 'pulse 1.5s' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.6 }
            }
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {getTimeSinceUpdate()}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default PriceUpdateIndicator;