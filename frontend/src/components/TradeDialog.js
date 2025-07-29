// src/components/TradeDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount < 1 ? 6 : 2,
    maximumFractionDigits: amount < 1 ? 6 : 2
  }).format(amount);
};

const TradeDialog = ({ open, onClose, token, onExecuteTrade, walletBalance }) => {
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [total, setTotal] = useState(0);

  // Reset form on token change
  useEffect(() => {
    setTradeType('buy');
    setAmount('');
    setError(null);
    setSuccess(null);
    setTotal(0);
  }, [token]);

  // Calculate total when amount changes
  useEffect(() => {
    if (token && amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        if (tradeType === 'buy') {
          // Calculate SOL cost based on token price
          setTotal(numAmount * token.current_price);
        } else {
          // Calculate USD value for selling
          setTotal(numAmount * token.current_price);
        }
      } else {
        setTotal(0);
      }
    } else {
      setTotal(0);
    }
  }, [token, amount, tradeType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Additional validation for buy orders (check wallet balance)
    if (tradeType === 'buy' && total > walletBalance) {
      setError(`Insufficient balance. You need ${formatMoney(total)} but only have ${walletBalance} SOL`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Execute trade
      const result = await onExecuteTrade(token.id, amount, tradeType);

      // Show success message
      setSuccess(`${tradeType === 'buy' ? 'Buy' : 'Sell'} order executed successfully!`);
      
      // Reset form after success
      setAmount('');
      setTotal(0);

      // Close dialog after 2 seconds on success
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to execute trade. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Trade {token.name} ({token.symbol.toUpperCase()})
          </Typography>
          <Button 
            onClick={onClose}
            disabled={submitting}
            color="inherit"
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {token.image && (
            <img 
              src={token.image} 
              alt={token.name} 
              width={36} 
              height={36}
              style={{ marginRight: 12 }}
            />
          )}
          <Box>
            <Typography variant="h6" sx={{ mb: 0 }}>
              {formatMoney(token.current_price)}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: token.price_change_percentage_24h >= 0 ? 'success.main' : 'error.main'
            }}>
              <Typography variant="body2">
                {token.price_change_percentage_24h >= 0 ? '+' : ''}
                {token.price_change_percentage_24h.toFixed(2)}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                24h
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box component="form" onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Trade Type</InputLabel>
            <Select
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value)}
              label="Trade Type"
              disabled={submitting}
            >
              <MenuItem value="buy">Buy</MenuItem>
              <MenuItem value="sell">Sell</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label={`Amount to ${tradeType}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            fullWidth
            variant="outlined"
            sx={{ mb: 3 }}
            disabled={submitting}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {tradeType === 'buy' ? token.symbol.toUpperCase() : token.symbol.toUpperCase()}
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ 
            p: 2, 
            bgcolor: 'background.default', 
            borderRadius: 1,
            mb: 3
          }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Order Summary
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Price</Typography>
              <Typography variant="body2">{formatMoney(token.current_price)}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Amount</Typography>
              <Typography variant="body2">
                {amount ? parseFloat(amount).toFixed(6) : '0'} {token.symbol.toUpperCase()}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">Total</Typography>
              <Typography variant="subtitle2">
                {formatMoney(total)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Wallet Balance
            </Typography>
            <Typography variant="h6">
              {walletBalance.toFixed(4)} SOL
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={submitting || !amount || parseFloat(amount) <= 0}
        >
          {submitting ? (
            <CircularProgress size={24} />
          ) : (
            `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${token.symbol.toUpperCase()}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TradeDialog;