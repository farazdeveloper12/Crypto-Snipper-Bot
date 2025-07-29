import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

const Debug = () => {
  const [envVars, setEnvVars] = useState({});
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    // Collect environment variables that are exposed to the browser
    const browserEnvVars = {};
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('REACT_APP_')) {
        browserEnvVars[key] = process.env[key];
      }
    });
    setEnvVars(browserEnvVars);

    // Update window size on resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <Paper sx={{ p: 2, mt: 2, opacity: 0.9 }}>
      <Typography variant="h6" gutterBottom>Debug Info</Typography>
      
      <Typography variant="subtitle2">Environment Variables:</Typography>
      <Box component="pre" sx={{ 
        bgcolor: 'background.paper', 
        p: 1, 
        borderRadius: 1,
        overflow: 'auto',
        fontSize: '0.8rem',
        maxHeight: '100px'
      }}>
        {JSON.stringify(envVars, null, 2)}
      </Box>

      <Typography variant="subtitle2" sx={{ mt: 1 }}>Window Size:</Typography>
      <Box component="pre" sx={{ 
        bgcolor: 'background.paper', 
        p: 1, 
        borderRadius: 1
      }}>
        Width: {windowSize.width}px, Height: {windowSize.height}px
      </Box>

      <Button 
        variant="outlined" 
        size="small" 
        sx={{ mt: 1 }}
        onClick={refreshPage}
      >
        Refresh Page
      </Button>
    </Paper>
  );
};

export default Debug;