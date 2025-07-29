// src/components/MemeCoinList.js
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  CircularProgress,
  Skeleton
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const MemeCoinList = ({ memeCoins, loading, onTradeClick }) => {
  const formatPercentage = (value) => {
    if (typeof value !== 'number') return '0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Render loading skeletons
  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from(new Array(3)).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box>
                    <Skeleton variant="text" width={100} />
                    <Skeleton variant="text" width={60} />
                  </Box>
                </Box>
                <Skeleton variant="text" />
                <Skeleton variant="text" width="60%" />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Skeleton variant="rectangular" width={60} height={30} />
                  <Skeleton variant="rectangular" width={80} height={30} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // No meme coins found
  if (!memeCoins || memeCoins.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Typography color="text.secondary">
          No trending meme coins available at the moment.
        </Typography>
      </Paper>
    );
  }

  // Render meme coins grid
  return (
    <Grid container spacing={2}>
      {memeCoins.map((coin) => (
        <Grid item xs={12} sm={6} md={4} key={coin.id}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
          >
            <CardActionArea sx={{ height: '100%' }} onClick={() => onTradeClick(coin)}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {coin.image ? (
                    <img
                      src={coin.image}
                      alt={coin.name}
                      style={{ width: 40, height: 40, marginRight: 16 }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: 'primary.main',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        mr: 2
                      }}
                    >
                      {coin.symbol ? coin.symbol.substring(0, 1) : '?'}
                    </Box>
                  )}
                  <Box>
                    <Typography variant="h6" component="div">
                      {coin.symbol ? coin.symbol.toUpperCase() : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {coin.name || 'Unknown Token'}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h5" component="div" sx={{ mb: 1 }}>
                  ${typeof coin.current_price === 'number' ? coin.current_price.toFixed(coin.current_price < 0.01 ? 6 : 2) : '0.00'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {coin.price_change_percentage_24h >= 0 ? (
                    <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: 'error.main', mr: 0.5 }} />
                  )}
                  <Typography
                    variant="body2"
                    color={coin.price_change_percentage_24h >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatPercentage(coin.price_change_percentage_24h)} (24h)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Market Cap: ${typeof coin.market_cap === 'number'
                      ? coin.market_cap >= 1e9
                        ? (coin.market_cap / 1e9).toFixed(2) + 'B'
                        : coin.market_cap >= 1e6
                        ? (coin.market_cap / 1e6).toFixed(2) + 'M'
                        : coin.market_cap.toLocaleString()
                      : 'N/A'}
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<ShoppingCartIcon />}
                    sx={{ minWidth: 'auto' }}
                  >
                    Trade
                  </Button>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default MemeCoinList;