// src/components/Dashboard/BotStatus.js
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Chip, CircularProgress, Alert } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import apiService from '../../services/api';

const BotStatus = ({ walletConnected, walletAddress }) => {
  const [botStatus, setBotStatus] = useState('inactive');
  const [loading, setLoading] = useState(false);
  const [performance, setPerformance] = useState({
    totalTrades: 0,
    successfulTrades: 0,
    totalProfit: 0,
    averageROI: 0,
    uptime: '0h 0m'
  });
  
  // Fetch bot status on mount and periodically
  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 30000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  const fetchBotStatus = async () => {
    try {
      const response = await apiService.botControl.getStatus();
      if (response.data && response.data.status === 'success') {
        setBotStatus(response.data.data?.botStatus || 'inactive');
        
        // Update performance metrics if available
        if (response.data.data?.performance) {
          setPerformance({
            ...performance,
            ...response.data.data.performance,
            uptime: calculateUptime(response.data.data.startTime)
          });
        }
      }
    } catch (error) {
      console.error('Error fetching bot status:', error);
    }
  };

  const calculateUptime = (startTime) => {
    if (!startTime || botStatus !== 'active') return '—';
    
    const started = new Date(startTime);
    const now = new Date();
    const diffMs = now - started;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  const handleToggleBot = async () => {
    if (!walletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      if (botStatus === 'active') {
        // Stop bot
        const response = await apiService.botControl.stop();
        if (response.data && response.data.status === 'success') {
          setBotStatus('inactive');
          console.log('Bot stopped successfully');
        } else {
          throw new Error(response.data?.message || 'Failed to stop bot');
        }
      } else {
        // Start bot
        const response = await apiService.botControl.start(walletAddress, {});
        if (response.data && response.data.status === 'success') {
          setBotStatus('active');
          console.log('Bot started successfully');
        } else {
          throw new Error(response.data?.message || 'Failed to start bot');
        }
      }
      
      // Refresh status after action
      await fetchBotStatus();
    } catch (error) {
      console.error('Error toggling bot:', error);
      alert(`Failed to ${botStatus === 'active' ? 'stop' : 'start'} the bot`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 3,
        backgroundImage: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Bot Status
      </Typography>
      
      <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
        <Box 
          sx={{ 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            bgcolor: botStatus === 'active' ? '#4caf50' : '#ff5722',
            boxShadow: botStatus === 'active' ? '0 0 10px #4caf50' : '0 0 10px #ff5722',
            mr: 1.5,
            animation: botStatus === 'active' ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': {
                opacity: 1,
                transform: 'scale(1)'
              },
              '50%': {
                opacity: 0.5,
                transform: 'scale(1.2)'
              },
              '100%': {
                opacity: 1,
                transform: 'scale(1)'
              }
            }
          }} 
        />
        <Typography variant="h5" fontWeight="medium">
          {botStatus === 'active' ? 'Active' : 'Inactive'}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2">Current Strategy:</Typography>
        <Chip 
          size="small" 
          label="Auto Trading" 
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} 
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2">Uptime:</Typography>
        <Typography variant="body2" fontWeight="medium">
          {performance.uptime}
        </Typography>
      </Box>
      
      {botStatus === 'active' && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2">Profit:</Typography>
            <Typography variant="body2" fontWeight="medium">
              ${performance.totalProfit?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2">Success Rate:</Typography>
            <Typography variant="body2" fontWeight="medium">
              {performance.totalTrades ? 
                `${((performance.successfulTrades / performance.totalTrades) * 100).toFixed(0)}%` : 
                '0%'}
            </Typography>
          </Box>
        </>
      )}
      
      <Button
        variant="contained"
        color={botStatus === 'active' ? 'error' : 'success'}
        fullWidth
        startIcon={botStatus === 'active' ? <StopIcon /> : <PlayArrowIcon />}
        onClick={handleToggleBot}
        disabled={loading || !walletConnected}
        sx={{ 
          mt: 2, 
          bgcolor: botStatus === 'active' ? 'error.main' : 'success.main',
          '&:hover': {
            bgcolor: botStatus === 'active' ? 'error.dark' : 'success.dark'
          }
        }}
      >
        {loading ? 
          <CircularProgress size={24} color="inherit" /> : 
          (botStatus === 'active' ? 'Stop Bot' : 'Start Bot')}
      </Button>
      
      {!walletConnected && (
        <Alert severity="info" sx={{ mt: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}>
          Please connect your wallet to start the bot
        </Alert>
      )}
    </Paper>
  );
};

export default BotStatus;