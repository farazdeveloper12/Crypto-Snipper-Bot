// src/components/Wallet/WalletBalance.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, IconButton, Alert, Card } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import apiService from '../../services/api';

const WalletBalance = ({ walletAddress }) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First try using our backend API
      try {
        console.log("Fetching balance via backend API...");
        const response = await apiService.wallet.getBalance(walletAddress);
        if (response.data && response.data.status === 'success') {
          setBalance(response.data.data.balanceSol);
          setLastUpdated(new Date());
          console.log('Retrieved balance from API:', response.data.data.balanceSol, 'SOL');
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('Backend API balance fetch failed, falling back to direct RPC', apiError);
      }

      // If backend fails, fallback to direct JSON-RPC call
      console.log("Fetching balance via direct RPC...");
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress]
        })
      });
      
      const data = await response.json();
      
      if (data.result && typeof data.result.value === 'number') {
        // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
        const solBalance = data.result.value / 1000000000;
        setBalance(solBalance);
        setLastUpdated(new Date());
        console.log('Retrieved balance from direct RPC:', solBalance, 'SOL');
      } else if (data.error) {
        console.error('RPC error:', data.error);
        // Fallback to alternative endpoint
        await fetchBalanceFromAlternative();
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      // Try alternative endpoints
      await fetchBalanceFromAlternative();
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceFromAlternative = async () => {
    try {
      console.log("Fetching balance via alternative RPC...");
      // Try GenesysGo endpoint
      const response = await fetch('https://ssc-dao.genesysgo.net', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress]
        })
      });
      
      const data = await response.json();
      
      if (data.result && typeof data.result.value === 'number') {
        const solBalance = data.result.value / 1000000000;
        setBalance(solBalance);
        setLastUpdated(new Date());
        console.log('Retrieved balance from alternative:', solBalance, 'SOL');
      } else {
        throw new Error('Failed to get balance from alternative endpoint');
      }
    } catch (error) {
      console.error('Error fetching from alternative:', error);
      setError('Unable to retrieve balance');
    }
  };

  // Fetch on mount and when wallet changes
  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
      // Refresh every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <Alert severity="info" variant="outlined">
        Connect your wallet to view balance
      </Alert>
    );
  }

  return (
    <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Wallet Balance
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Fetching balance...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 1 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Typography variant="h4" fontWeight="bold">
            {balance.toFixed(5)} SOL
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ≈ ${(balance * 100).toFixed(2)} USD
          </Typography>
          
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </>
      )}
      
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton 
          onClick={fetchBalance} 
          disabled={loading}
          size="small"
          title="Refresh balance"
        >
          {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Box>
    </Card>
  );
};

export default WalletBalance;