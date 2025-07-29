// frontend/src/components/Trading/NewLaunches.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';

const formatTimeSinceLaunch = (createdAt) => {
  if (!createdAt) return 'N/A';
  const now = new Date();
  const diff = now - new Date(createdAt);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h ago`;
  }
  return `${hours}h ${minutes}m ago`;
};

function NewLaunches() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [notifyEnabled, setNotifyEnabled] = useState({});

  const fetchNewTokens = async () => {
    try {
      setLoading(true);
      // Use the Solana chain for our crypto sniper bot
      const response = await axios.get('/api/new-launches?chain=solana&limit=10', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.data.status === 'success') {
        setTokens(response.data.data);
        setLastUpdated(new Date());
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching new token launches:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewTokens();
    const interval = setInterval(fetchNewTokens, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleToggleNotify = (address) => {
    setNotifyEnabled((prev) => ({
      ...prev,
      [address]: !prev[address],
    }));
  };

  const handleTradeClick = (token) => {
    // Implement trade functionality here
    console.log("Trading token:", token);
    // You could call your backend API to execute a trade
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">New Token Launches</Typography>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
          <Button 
            variant="outlined"
            size="small"
            onClick={fetchNewTokens}
            disabled={loading}
            sx={{ ml: 2 }}
          >
            Scan for new launches
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : tokens.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No new token launches detected. The bot is actively monitoring for new tokens.
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token</TableCell>
                <TableCell>Launched</TableCell>
                <TableCell>Price (USD)</TableCell>
                <TableCell>Liquidity</TableCell>
                <TableCell>Volume (24h)</TableCell>
                <TableCell>Track with Bot</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map((token) => {
                const address = token.address || '???';
                const symbol = token.symbol || '???';
                const name = token.name || '???';
                const price = token.price || 0;
                const liquidity = token.liquidity || 0;
                const volume24h = token.volume24h || 0;
                const createdAt = token.createdAt || token.timeDetected;

                return (
                  <TableRow key={address}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {token.imageUrl ? (
                          <img 
                            src={token.imageUrl} 
                            alt={symbol}
                            style={{ width: 40, height: 40, marginRight: 16, borderRadius: '50%' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              color: 'white',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              mr: 2,
                            }}
                          >
                            {symbol.charAt(0).toUpperCase()}
                          </Box>
                        )}
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {symbol.toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTimeSinceLaunch(createdAt)}
                      </Typography>
                      {createdAt && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(createdAt).toLocaleString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>${price.toFixed(6)}</TableCell>
                    <TableCell>${liquidity.toLocaleString()}</TableCell>
                    <TableCell>${volume24h.toLocaleString()}</TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!notifyEnabled[address]}
                            onChange={() => handleToggleNotify(address)}
                            color="primary"
                          />
                        }
                        label={notifyEnabled[address] ? 'On' : 'Off'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => handleTradeClick(token)}
                        color="secondary"
                      >
                        Trade
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default NewLaunches;