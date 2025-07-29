// src/pages/DashboardPage.js
import React from 'react';
import { Box, Grid, Typography, Paper, Divider } from '@mui/material';
import BotStatus from '../components/Dashboard/BotStatus';
import PerformanceChart from '../components/Dashboard/PerformanceChart';
import TransactionTable from '../components/Dashboard/TransactionTable';

const DashboardPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Key Metrics Section */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <BotStatus />
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Performance
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Profit
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      $1,245.67
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Successful Trades
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      24/28 (85.7%)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Average ROI
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" color="success.main">
                      +18.5%
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Activity Summary */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Activity Summary
            </Typography>
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Today
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Trades Executed</Typography>
                  <Typography variant="body2" fontWeight="medium">3</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Volume</Typography>
                  <Typography variant="body2" fontWeight="medium">$2,450</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  This Week
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Trades Executed</Typography>
                  <Typography variant="body2" fontWeight="medium">12</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Volume</Typography>
                  <Typography variant="body2" fontWeight="medium">$8,720</Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  All Time
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Trades Executed</Typography>
                  <Typography variant="body2" fontWeight="medium">28</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Volume</Typography>
                  <Typography variant="body2" fontWeight="medium">$15,340</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Performance Chart */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Performance History
            </Typography>
            <PerformanceChart />
          </Paper>
        </Grid>
        
        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            <TransactionTable />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;