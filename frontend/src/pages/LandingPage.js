// src/pages/LandingPage.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Divider,
} from '@mui/material';

const LandingPage = () => {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box
        sx={{
          bgcolor: 'primary.main',
          backgroundImage: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" color="white" gutterBottom>
                Crypto Sniper Bot
              </Typography>
              <Typography variant="h5" color="white" sx={{ opacity: 0.8, mb: 4 }}>
                Automated trading assistant for cryptocurrency markets
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  color="secondary"
                  size="large"
                  sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                >
                  Sign In
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="outlined"
                  color="inherit"
                  size="large"
                  sx={{ px: 4, py: 1.5, fontSize: '1.1rem', color: 'white', borderColor: 'white' }}
                >
                  Create Account
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  width: '100%',
                  height: 300,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Typography variant="h5">Trading Bot Dashboard Preview</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Key Features
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Our bot comes with everything you need for successful trading
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>
                Automated Trading
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2">
                Auto-buy and auto-sell with custom settings. Set your parameters once and let the bot execute trades automatically.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>
                Risk Management
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2">
                Built-in features like stop-loss, trailing stop-loss, and take-profit settings help in managing potential risks.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>
                Scam Detection
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2">
                Incorporates advanced filters to prevent the purchase of scam tokens and protect against rug pulls.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LandingPage;