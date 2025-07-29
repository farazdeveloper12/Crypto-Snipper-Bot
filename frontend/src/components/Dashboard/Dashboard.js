import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Container,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import TransactionTable from './Dashboard/TransactionTable'; // Import TransactionTable

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    botStatus: 'inactive',
    totalProfit: 0,
    tradeCount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bot status and performance
        const statusResponse = await axios.get('http://localhost:5002/api/bot/status', {
          params: { userId: 'default-user' },
        });
        const performanceResponse = await axios.get('http://localhost:5002/api/bot/performance', {
          params: { userId: 'default-user' },
        });

        setStats({
          botStatus: statusResponse.data.status,
          totalProfit: performanceResponse.data.performance.totalProfit,
          tradeCount: performanceResponse.data.performance.totalTrades,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Fetch every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleToggleBot = async () => {
    try {
      if (stats.botStatus === 'active') {
        await axios.post('http://localhost:5002/api/bot/stop', { userId: 'default-user' });
      } else {
        await axios.post('http://localhost:5002/api/bot/start', {
          userId: 'default-user',
          walletAddress: '5h4sVsNhuxcqtaWP1XUTPUwQdDEbuuXBeN27fGgirap9',
          settings: {
            maxTradeAmount: 0.01,
            slippage: 3,
            takeProfit: 50,
            stopLoss: 10,
            scamDetection: true,
            gasMultiplier: 1.5,
          },
        });
      }
      window.location.reload();
    } catch (error) {
      console.error('Error toggling bot:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Bot Status
              </Typography>
              <Typography
                variant="h5"
                color={stats.botStatus === 'active' ? 'success.main' : 'error.main'}
                sx={{ fontWeight: 'bold' }}
              >
                {stats.botStatus === 'active' ? 'Active' : 'Inactive'}
              </Typography>
              <Button
                variant="contained"
                color={stats.botStatus === 'active' ? 'error' : 'success'}
                sx={{ mt: 2 }}
                onClick={handleToggleBot}
              >
                {stats.botStatus === 'active' ? 'Stop Bot' : 'Start Bot'}
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Total Profit
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                ${stats.totalProfit.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Completed Trades
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {stats.tradeCount}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <TransactionTable />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard;