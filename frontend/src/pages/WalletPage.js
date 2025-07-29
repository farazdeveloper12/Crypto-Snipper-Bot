// src/pages/WalletPage.js
import React from 'react';
import { Box, Typography, Button, Paper, Grid, Alert } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WalletBalance from '../components/Wallet/WalletBalance';

const WalletPage = ({ walletConnected, walletAddress, connectWallet, disconnectWallet }) => {
  // Format wallet address for display
  const formatWalletAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Wallet Integration
      </Typography>
      
      {!walletConnected ? (
        <Paper 
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Connect a wallet to start trading
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
            Connect your Solana wallet to access trading features, monitor your portfolio, and start using the Crypto Sniper Bot.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={connectWallet}
            sx={{ minWidth: 220 }}
          >
            Connect Wallet
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Connected Wallet
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: 'monospace', 
                  p: 2, 
                  bgcolor: 'background.default', 
                  borderRadius: 1,
                  overflowX: 'auto'
                }}
              >
                {walletAddress}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <WalletBalance walletAddress={walletAddress} />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="error"
                onClick={disconnectWallet}
                sx={{ minWidth: 200 }}
              >
                Disconnect Wallet
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default WalletPage;