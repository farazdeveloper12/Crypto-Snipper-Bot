// src/components/TradingSettings.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Paper,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';

const TradingSettings = ({ onSaveSettings, initialSettings }) => {
  // Default settings
  const defaultSettings = {
    maxTradeAmount: 0.1,
    slippage: 3,
    takeProfit: 50,
    stopLoss: 10,
    scamDetection: true
  };

  // Use provided settings or defaults
  const [settings, setSettings] = useState(initialSettings || defaultSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update local settings when props change
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : parseFloat(event.target.value);
    
    setSettings({
      ...settings,
      [field]: value
    });
  };

  const handleSliderChange = (field) => (event, newValue) => {
    setSettings({
      ...settings,
      [field]: newValue
    });
  };

  const handleSave = () => {
    if (onSaveSettings) {
      onSaveSettings(settings);
    }
    setSaveSuccess(true);
  };

  const handleCloseSnackbar = () => {
    setSaveSuccess(false);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>Trading Settings</Typography>
      
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Trade Parameters
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography gutterBottom>Max Trade Amount: {settings.maxTradeAmount} SOL</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                value={settings.maxTradeAmount}
                onChange={handleSliderChange('maxTradeAmount')}
                min={0.01}
                max={1}
                step={0.01}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} SOL`}
                sx={{ mr: 2, flexGrow: 1 }}
              />
              <TextField
                value={settings.maxTradeAmount}
                onChange={handleChange('maxTradeAmount')}
                type="number"
                size="small"
                InputProps={{ inputProps: { min: 0.01, max: 1, step: 0.01 } }}
                sx={{ width: 100 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Slippage Tolerance: {settings.slippage}%</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                value={settings.slippage}
                onChange={handleSliderChange('slippage')}
                min={0.1}
                max={10}
                step={0.1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{ mr: 2, flexGrow: 1 }}
              />
              <TextField
                value={settings.slippage}
                onChange={handleChange('slippage')}
                type="number"
                size="small"
                InputProps={{ inputProps: { min: 0.1, max: 10, step: 0.1 } }}
                sx={{ width: 100 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Risk Management
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography gutterBottom>Take Profit: {settings.takeProfit}%</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                value={settings.takeProfit}
                onChange={handleSliderChange('takeProfit')}
                min={5}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{ mr: 2, flexGrow: 1 }}
              />
              <TextField
                value={settings.takeProfit}
                onChange={handleChange('takeProfit')}
                type="number"
                size="small"
                InputProps={{ inputProps: { min: 5, max: 100, step: 1 } }}
                sx={{ width: 100 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Stop Loss: {settings.stopLoss}%</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                value={settings.stopLoss}
                onChange={handleSliderChange('stopLoss')}
                min={1}
                max={50}
                step={1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{ mr: 2, flexGrow: 1 }}
              />
              <TextField
                value={settings.stopLoss}
                onChange={handleChange('stopLoss')}
                type="number"
                size="small"
                InputProps={{ inputProps: { min: 1, max: 50, step: 1 } }}
                sx={{ width: 100 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.scamDetection}
                  onChange={handleChange('scamDetection')}
                  color="primary"
                />
              }
              label="Scam Detection"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enable advanced scam detection to protect against rug pulls and honeypots
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSave}
        sx={{ mt: 2 }}
      >
        Save Settings
      </Button>
      
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TradingSettings;