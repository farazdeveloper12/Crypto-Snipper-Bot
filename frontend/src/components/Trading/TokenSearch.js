// src/components/Trading/TokenSearch.js
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';

const TokenSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = () => {
    if (!searchQuery) {
      setError('Please enter a token address or name');
      return;
    }

    setIsSearching(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      // For demonstration purposes, we'll always show a token for "SOL" or any address
      if (searchQuery.toLowerCase() === 'sol' || searchQuery.length > 30) {
        setTokenData({
          name: 'Solana',
          symbol: 'SOL',
          address: 'So11111111111111111111111111111111111111112',
          price: 104.32,
          priceChange24h: 2.5,
          marketCap: 41258432156,
          volume24h: 1254785412,
          verified: true,
          scamProbability: 0.01,
          launchDate: '2020-03-16',
          holders: 842546,
          liquidity: '$250M',
        });
      } else {
        setError('Token not found. Please check the address or name.');
        setTokenData(null);
      }
      setIsSearching(false);
    }, 1500);
  };

  const handleAddToSniping = () => {
    // Logic to add token to sniping list
    console.log('Adding to sniping list:', tokenData);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter token address or name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery}
                  >
                    {isSearching ? <CircularProgress size={24} /> : 'Search'}
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Grid>

        {tokenData && (
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'white',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      mr: 2,
                    }}
                  >
                    {tokenData.symbol.charAt(0)}
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h5" fontWeight="bold">
                        {tokenData.name}
                      </Typography>
                      {tokenData.verified && (
                        <VerifiedIcon color="primary" sx={{ ml: 1 }} />
                      )}
                    </Box>
                    <Typography color="text.secondary">
                      {tokenData.symbol}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleAddToSniping}
                >
                  Add to Sniping
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Token Address
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: 'background.default',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                    }}
                  >
                    {tokenData.address}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Current Price
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight="bold">
                        ${tokenData.price.toFixed(2)}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${tokenData.priceChange24h > 0 ? '+' : ''}${tokenData.priceChange24h}%`}
                        color={tokenData.priceChange24h >= 0 ? 'success' : 'error'}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Scam Probability
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight="bold" color={tokenData.scamProbability < 0.1 ? 'success.main' : 'error.main'}>
                        {(tokenData.scamProbability * 100).toFixed(1)}%
                      </Typography>
                      {tokenData.scamProbability < 0.1 ? (
                        <Chip size="small" label="Safe" color="success" sx={{ ml: 1 }} />
                      ) : (
                        <Chip size="small" label="Risky" color="error" sx={{ ml: 1 }} icon={<WarningIcon />} />
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Market Cap
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ${(tokenData.marketCap / 1000000).toFixed(1)}M
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    24h Volume
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ${(tokenData.volume24h / 1000000).toFixed(1)}M
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    24h Volume
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ${(tokenData.volume24h / 1000000).toFixed(1)}M
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Holders
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {tokenData.holders.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Launch Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(tokenData.launchDate).toLocaleDateString()}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Liquidity
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {tokenData.liquidity}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TokenSearch;