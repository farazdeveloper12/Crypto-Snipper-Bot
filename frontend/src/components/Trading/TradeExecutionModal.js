// frontend/src/components/Trading/TradeExecutionModal.js
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Typography 
} from '@mui/material';
import { executeSnipe } from '../../services/api';
import { validateTradeAmount } from '../../utils/validators';

const TradeExecutionModal = ({ 
  open, 
  onClose, 
  token 
}) => {
  const [tradeAmount, setTradeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTradeExecution = async () => {
    // Validate trade amount
    if (!validateTradeAmount(tradeAmount, token.blockchain)) {
      setError('Invalid trade amount');
      return;
    }

    setLoading(true);
    try {
      await executeSnipe({
        tokenAddress: token.address,
        amount: parseFloat(tradeAmount),
        blockchain: token.blockchain
      });
      
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Execute Trade</DialogTitle>
      <DialogContent>
        <Typography variant="h6">{token.name} ({token.symbol})</Typography>
        
        <TextField
          fullWidth
          margin="normal"
          label="Trade Amount"
          type="number"
          value={tradeAmount}
          onChange={(e) => setTradeAmount(e.target.value)}
          helperText={`Min: 0.001 ${token.blockchain.toUpperCase()}`}
        />

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button 
          onClick={handleTradeExecution} 
          color="primary" 
          disabled={loading}
        >
          Execute Trade
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TradeExecutionModal;