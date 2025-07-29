// src/components/TokenList.js
import React, { useState } from 'react';
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
  TextField,
  InputAdornment
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const TokenList = ({ tokens, loading, onSearch, onRefresh, onTokenSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const formatPercentage = (value) => {
    if (typeof value !== 'number') return '0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
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
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search for tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={onRefresh}
                    disabled={loading}
                    title="Refresh List"
                  >
                    {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </form>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : tokens && tokens.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'background.paper' }}>
                <TableCell>Token</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">24h Change</TableCell>
                <TableCell align="right">Market Cap</TableCell>
                <TableCell align="right">Volume (24h)</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {token.image ? (
                        <img
                          src={token.image}
                          alt={token.name}
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
                            mr: 1
                          }}
                        >
                          {token.symbol ? token.symbol.substring(0, 1) : '?'}
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {token.symbol ? token.symbol.toUpperCase() : 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {token.name || 'Unknown Token'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      ${typeof token.current_price === 'number' ? token.current_price.toFixed(token.current_price < 0.01 ? 6 : 2) : '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {token.price_change_percentage_24h > 0 ? (
                        <TrendingUpIcon fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                      ) : (
                        <TrendingDownIcon fontSize="small" sx={{ color: 'error.main', mr: 0.5 }} />
                      )}
                      <Typography
                        variant="body2"
                        color={token.price_change_percentage_24h >= 0 ? 'success.main' : 'error.main'}
                      >
                        {formatPercentage(token.price_change_percentage_24h)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      ${typeof token.market_cap === 'number'
                          ? token.market_cap >= 1e9
                            ? (token.market_cap / 1e9).toFixed(2) + 'B'
                            : token.market_cap >= 1e6
                            ? (token.market_cap / 1e6).toFixed(2) + 'M'
                            : token.market_cap.toLocaleString()
                          : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      ${typeof token.total_volume === 'number'
                          ? token.total_volume >= 1e9
                            ? (token.total_volume / 1e9).toFixed(2) + 'B'
                            : token.total_volume >= 1e6
                            ? (token.total_volume / 1e6).toFixed(2) + 'M'
                            : token.total_volume.toLocaleString()
                          : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => onTokenSelect(token)}
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
            No tokens found. Try a different search or refresh the list.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TokenList;