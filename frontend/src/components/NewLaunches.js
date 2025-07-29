// src/components/NewLaunches.js
import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  CircularProgress,
  IconButton,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const NewLaunches = ({ newCoins, loading, onTradeClick, onRefresh }) => {
  // Format time since launch
  const getTimeSinceLaunch = (launchTime) => {
    if (!launchTime) return 'Unknown';
    
    const launchDate = new Date(launchTime);
    const now = new Date();
    const diffMs = now - launchDate;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  // Format percentage change
  const formatPercentage = (value) => {
    if (typeof value !== 'number') return '0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Get risk color
  const getRiskColor = (risk) => {
    if (!risk) return 'default';
    
    switch (risk.toLowerCase()) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        mb: 4,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Recently Launched Tokens
        </Typography>
        
        <IconButton
          size="small"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : newCoins && newCoins.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Token</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Since Launch</TableCell>
                <TableCell align="right">Launched</TableCell>
                <TableCell align="right">Risk</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {newCoins.map((coin) => (
                <TableRow key={coin.id || Math.random().toString()} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {coin.image ? (
                        <img 
                          src={coin.image} 
                          alt={coin.name || 'token'} 
                          style={{ width: 24, height: 24, marginRight: 8 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: 'primary.main',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginRight: 1
                          }}
                        >
                          {coin.symbol ? coin.symbol.substring(0, 1) : '?'}
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {coin.symbol ? coin.symbol.toUpperCase() : 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {coin.name || 'Unknown Token'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      ${typeof coin.current_price === 'number' ? coin.current_price.toFixed(coin.current_price < 0.01 ? 6 : 2) : '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {typeof coin.price_change_percentage_since_launch === 'number' && (
                        <TrendingUpIcon 
                          fontSize="small" 
                          sx={{ 
                            mr: 0.5, 
                            color: coin.price_change_percentage_since_launch >= 0 ? 'success.main' : 'error.main',
                            transform: coin.price_change_percentage_since_launch >= 0 ? 'none' : 'rotate(180deg)'
                          }} 
                        />
                      )}
                      <Typography
                        variant="body2"
                        color={coin.price_change_percentage_since_launch >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatPercentage(coin.price_change_percentage_since_launch)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {getTimeSinceLaunch(coin.launchTime)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      size="small" 
                      label={coin.scamRisk || 'Unknown'} 
                      color={getRiskColor(coin.scamRisk)}
                      sx={{ minWidth: 70 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => onTradeClick(coin)}
                    >
                      Trade
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No new token launches found. Click refresh to check again.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default NewLaunches;