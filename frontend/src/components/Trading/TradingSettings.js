// src/components/Trading/TradingSettings.js
import React, { useState, useContext } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Slider,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Alert,
  InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import { TradingContext } from '../../context/TradingContext';

const TradingSettings = () => {
  const { tradingSettings: defaultSettings, updateSettings, loading } = useContext(TradingContext);
  
  const [settings, setSettings] = useState({
    maxTrade: 0.01, // Changed default from 0.1 to 0.01
    slippage: 3,
    autoTakeProfit: 50,
    autoStopLoss: 10,
    trailingStopLoss: false,
    scamCheck: true,
    antiRugPull: true,
    frontrunProtection: true,
    gasLimit: 300000,
    ...defaultSettings,
  });
  
  const [saved, setSaved] = useState(false);
  
  const handleSliderChange = (name) => (event, newValue) => {
    setSettings({ ...settings, [name]: newValue });
    setSaved(false);
  };
  
  const handleInputChange = (name) => (event) => {
    const value = event.target.type === 'checkbox'
      ? event.target.checked
      : parseFloat(event.target.value);
    
    setSettings({ ...settings, [name]: value });
    setSaved(false);
  };
  
  const handleSaveSettings = async () => {
    // Create a modified settings object that maps frontend names to backend names
    const backendSettings = {
      maxTradeAmount: settings.maxTrade, // Map maxTrade to maxTradeAmount for backend
      slippage: settings.slippage,
      takeProfit: settings.autoTakeProfit, // Map autoTakeProfit to takeProfit
      stopLoss: settings.autoStopLoss, // Map autoStopLoss to stopLoss
      scamDetection: settings.scamCheck, // Map scamCheck to scamDetection
      trailingStopLoss: settings.trailingStopLoss,
      antiRugPull: settings.antiRugPull,
      frontrunProtection: settings.frontrunProtection,
      gasLimit: settings.gasLimit
    };
    
    console.log("Sending settings to backend:", backendSettings);
    
    // Call the context function to update settings
    const success = await updateSettings(backendSettings);
    
    // Also make a direct API call to set trade size
    try {
      // You may need to import axios at the top of the file
      const axios = require('axios').default;
      
      // Make a direct API call to ensure trade size is set
      await axios.post('/api/bot/set-trade-size', {
        tradeSize: settings.maxTrade.toString()
      });
      
      console.log("Directly set trade size to:", settings.maxTrade);
    } catch (error) {
      console.error("Error setting trade size directly:", error);
    }
    
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };
  
  const handleResetSettings = () => {
    setSettings({
      maxTrade: 0.01, // Changed default from 0.1 to 0.01
      slippage: 3,
      autoTakeProfit: 50,
      autoStopLoss: 10,
      trailingStopLoss: false,
      scamCheck: true,
      antiRugPull: true,
      frontrunProtection: true,
      gasLimit: 300000,
    });
    setSaved(false);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Trading Settings</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={handleResetSettings}
            sx={{ mr: 1 }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={loading}
          >
            Save Settings
          </Button>
        </Box>
      </Box>
      
      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Trade Parameters
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography id="max-trade-slider">
                  Max Trade Amount (SOL)
                </Typography>
                <TextField
                  value={settings.maxTrade}
                  onChange={handleInputChange('maxTrade')}
                  inputProps={{
                    step: 0.01,
                    min: 0.01,
                    max: 10,
                    type: 'number',
                    'aria-labelledby': 'max-trade-slider',
                  }}
                  sx={{ width: '80px' }}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">SOL</InputAdornment>,
                  }}
                />
              </Box>
              <Slider
                value={settings.maxTrade}
                onChange={handleSliderChange('maxTrade')}
                step={0.01}
                min={0.01}
                max={1}
                marks={[
                  { value: 0.01, label: '0.01' },
                  { value: 0.25, label: '0.25' },
                  { value: 0.5, label: '0.5' },
                  { value: 0.75, label: '0.75' },
                  { value: 1, label: '1' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography id="slippage-slider">
                  Slippage Tolerance (%)
                </Typography>
                <TextField
                  value={settings.slippage}
                  onChange={handleInputChange('slippage')}
                  inputProps={{
                    step: 0.1,
                    min: 0.1,
                    max: 20,
                    type: 'number',
                    'aria-labelledby': 'slippage-slider',
                  }}
                  sx={{ width: '80px' }}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Box>
              <Slider
                value={settings.slippage}
                onChange={handleSliderChange('slippage')}
                step={0.1}
                min={0.1}
                max={10}
                marks={[
                  { value: 0.5, label: '0.5%' },
                  { value: 1, label: '1%' },
                  { value: 3, label: '3%' },
                  { value: 5, label: '5%' },
                  { value: 10, label: '10%' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography id="gas-limit-slider">
                  Gas Limit
                </Typography>
                <TextField
                  value={settings.gasLimit}
                  onChange={handleInputChange('gasLimit')}
                  inputProps={{
                    step: 10000,
                    min: 100000,
                    max: 1000000,
                    type: 'number',
                    'aria-labelledby': 'gas-limit-slider',
                  }}
                  sx={{ width: '120px' }}
                  size="small"
                />
              </Box>
              <Slider
                value={settings.gasLimit}
                onChange={handleSliderChange('gasLimit')}
                step={10000}
                min={100000}
                max={500000}
                marks={[
                  { value: 100000, label: '100K' },
                  { value: 300000, label: '300K' },
                  { value: 500000, label: '500K' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Risk Management
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography id="take-profit-slider">
                  Auto Take Profit (%)
                </Typography>
                <TextField
                  value={settings.autoTakeProfit}
                  onChange={handleInputChange('autoTakeProfit')}
                  inputProps={{
                    step: 5,
                    min: 5,
                    max: 500,
                    type: 'number',
                    'aria-labelledby': 'take-profit-slider',
                  }}
                  sx={{ width: '80px' }}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Box>
              <Slider
                value={settings.autoTakeProfit}
                onChange={handleSliderChange('autoTakeProfit')}
                step={5}
                min={5}
                max={200}
                marks={[
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 100, label: '100%' },
                  { value: 150, label: '150%' },
                  { value: 200, label: '200%' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography id="stop-loss-slider">
                  Auto Stop Loss (%)
                </Typography>
                <TextField
                  value={settings.autoStopLoss}
                  onChange={handleInputChange('autoStopLoss')}
                  inputProps={{
                    step: 1,
                    min: 5,
                    max: 50,
                    type: 'number',
                    'aria-labelledby': 'stop-loss-slider',
                  }}
                  sx={{ width: '80px' }}
                  size="small"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Box>
              <Slider
                value={settings.autoStopLoss}
                onChange={handleSliderChange('autoStopLoss')}
                step={1}
                min={5}
                max={50}
                marks={[
                  { value: 5, label: '5%' },
                  { value: 10, label: '10%' },
                  { value: 20, label: '20%' },
                  { value: 30, label: '30%' },
                  { value: 50, label: '50%' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Safety Features
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.trailingStopLoss}
                    onChange={handleInputChange('trailingStopLoss')}
                    color="primary"
                  />
                }
                label="Enable Trailing Stop Loss"
                sx={{ display: 'block', mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.scamCheck}
                    onChange={handleInputChange('scamCheck')}
                    color="primary"
                  />
                }
                label="Scam Token Detection"
                sx={{ display: 'block', mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.antiRugPull}
                    onChange={handleInputChange('antiRugPull')}
                    color="primary"
                  />
                }
                label="Anti-Rug Pull Protection"
                sx={{ display: 'block', mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.frontrunProtection}
                    onChange={handleInputChange('frontrunProtection')}
                    color="primary"
                  />
                }
                label="Front-Running Protection"
                sx={{ display: 'block' }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingSettings;