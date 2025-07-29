import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bot-tabpanel-${index}`}
      aria-labelledby={`bot-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const HomePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [botStatus, setBotStatus] = useState('inactive');
  const [loading, setLoading] = useState(false);
  const [tradingSettings, setTradingSettings] = useState({
    maxTrade: 0.1,
    slippage: 3,
    autoTakeProfit: 50,
    autoStopLoss: 10,
    trailingStopLoss: false,
    scamCheck: true,
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSliderChange = (name) => (event, newValue) => {
    setTradingSettings({ ...tradingSettings, [name]: newValue });
  };

  const handleSwitchChange = (name) => (event) => {
    setTradingSettings({ ...tradingSettings, [name]: event.target.checked });
  };

  const toggleBotStatus = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setBotStatus(botStatus === 'active' ? 'inactive' : 'active');
      setLoading(false);
    }, 1000);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box sx={{ bgcolor: 'primary.main', p: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" color="white" fontWeight="bold">
            Crypto Sniper Bot
          </Typography>
          <Typography variant="subtitle1" color="white" sx={{ opacity: 0.8 }}>
            Automated trading assistant for cryptocurrency markets
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<DashboardIcon />} label="Dashboard" />
            <Tab icon={<TrendingUpIcon />} label="Trading" />
            <Tab icon={<AccountBalanceWalletIcon />} label="Wallet" />
            <Tab icon={<SettingsIcon />} label="Settings" />
          </Tabs>

          {/* Dashboard Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    border: 1,
                    borderColor: 'divider',
                    backgroundImage: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    color: 'white',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Bot Status
                  </Typography>
                  
                  <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: botStatus === 'active' ? '#4caf50' : '#ff5722',
                        boxShadow: botStatus === 'active' ? '0 0 10px #4caf50' : '0 0 10px #ff5722',
                        mr: 1.5,
                        animation: botStatus === 'active' ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': {
                            opacity: 1,
                            transform: 'scale(1)'
                          },
                          '50%': {
                            opacity: 0.5,
                            transform: 'scale(1.2)'
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'scale(1)'
                          }
                        }
                      }} 
                    />
                    <Typography variant="h5" fontWeight="medium">
                      {botStatus === 'active' ? 'Active' : 'Inactive'}
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    color={botStatus === 'active' ? 'error' : 'success'}
                    fullWidth
                    startIcon={botStatus === 'active' ? <StopIcon /> : <PlayArrowIcon />}
                    onClick={toggleBotStatus}
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : (botStatus === 'active' ? 'Stop Bot' : 'Start Bot')}
                  </Button>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Performance
                  </Typography>
                  
                  <Box sx={{ my: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Profit
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        $0.00
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Successful Trades
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        0/0 (0%)
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Average ROI
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        0%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No trading data available yet. Start the bot to begin trading.
                  </Alert>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Recent Transactions
                  </Typography>
                  
                  <Alert severity="info">
                    No transactions available yet. Start the bot to begin trading.
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Trading Tab */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" gutterBottom>
              Token Search
            </Typography>
            
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter token address or name"
              sx={{ mb: 3 }}
            />
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Search for tokens to add them to your trading list.
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Upcoming Token Launches
            </Typography>
            
            <Alert severity="info">
              No upcoming token launches found. Check back later.
            </Alert>
          </TabPanel>

          {/* Wallet Tab */}
          <TabPanel value={activeTab} index={2}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Connect Your Wallet
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Connect a wallet to start trading
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 400 }}>
                  Connect your Solana wallet to access trading features and monitor your portfolio.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  sx={{ minWidth: 200 }}
                >
                  Connect Wallet
                </Button>
              </Box>
            </Paper>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel value={activeTab} index={3}>
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
                      <Typography>
                        {tradingSettings.maxTrade} SOL
                      </Typography>
                    </Box>
                    <Slider
                      value={tradingSettings.maxTrade}
                      onChange={handleSliderChange('maxTrade')}
                      step={0.01}
                      min={0.01}
                      max={1}
                      marks={[
                        { value: 0.01, label: '0.01' },
                        { value: 0.5, label: '0.5' },
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
                      <Typography>
                        {tradingSettings.slippage}%
                      </Typography>
                    </Box>
                    <Slider
                      value={tradingSettings.slippage}
                      onChange={handleSliderChange('slippage')}
                      step={0.1}
                      min={0.1}
                      max={10}
                      marks={[
                        { value: 0.5, label: '0.5%' },
                        { value: 3, label: '3%' },
                        { value: 10, label: '10%' },
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
                      <Typography>
                        {tradingSettings.autoTakeProfit}%
                      </Typography>
                    </Box>
                    <Slider
                      value={tradingSettings.autoTakeProfit}
                      onChange={handleSliderChange('autoTakeProfit')}
                      step={5}
                      min={5}
                      max={200}
                      marks={[
                        { value: 25, label: '25%' },
                        { value: 50, label: '50%' },
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
                      <Typography>
                        {tradingSettings.autoStopLoss}%
                      </Typography>
                    </Box>
                    <Slider
                      value={tradingSettings.autoStopLoss}
                      onChange={handleSliderChange('autoStopLoss')}
                      step={1}
                      min={5}
                      max={50}
                      marks={[
                        { value: 5, label: '5%' },
                        { value: 10, label: '10%' },
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
                          checked={tradingSettings.trailingStopLoss}
                          onChange={handleSwitchChange('trailingStopLoss')}
                          color="primary"
                        />
                      }
                      label="Enable Trailing Stop Loss"
                      sx={{ display: 'block', mb: 1 }}
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tradingSettings.scamCheck}
                          onChange={handleSwitchChange('scamCheck')}
                          color="primary"
                        />
                      }
                      label="Scam Token Detection"
                      sx={{ display: 'block', mb: 1 }}
                    />
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="primary">
                    Save Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default HomePage;