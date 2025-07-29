// src/App.js

import ErrorDetector from './components/ErrorDetector';
import ErrorFinder from './components/ErrorFinder';
import ObjectErrorFinder from './components/ObjectErrorFinder';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress, 
  Alert,
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  Button,
  Grid,
  Tabs,
  Tab,
  Divider,
  IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import WalletIcon from '@mui/icons-material/Wallet';

// Import services and components
import walletService from './services/walletService';
import tokenService from './services/tokenService';
import TokenList from './components/TokenList';
import MemeCoinList from './components/MemeCoinList';
import TradeDialog from './components/TradeDialog';
import TradingSettings from './components/TradingSettings';
import NewLaunches from './components/NewLaunches';
import PriceUpdateIndicator from './components/PriceUpdateIndicator';
import { formatPublicKey } from './utils/solanaHelper';
import WalletBalance from './components/Wallet/WalletBalance';
import ErrorDebugger from './components/ErrorDebugger';
import WalletPage from './pages/WalletPage';
import BotStatus from './components/Dashboard/BotStatus';
// API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

// Configure axios
axios.defaults.baseURL = API_BASE_URL;

// TabPanel component
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

function App() {
  
  // State
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [botStatus, setBotStatus] = useState('inactive');
  const [botLoading, setBotLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [memeCoins, setMemeCoins] = useState([]);
  const [memeCoinsLoading, setMemeCoinsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [botSettings, setBotSettings] = useState({
    maxTradeAmount: 0.1,
    slippage: 3,
    takeProfit: 50,
    stopLoss: 10,
    scamDetection: true
  });
  const [newTokens, setNewTokens] = useState([]);
  const [newTokensLoading, setNewTokensLoading] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(new Date());
  
  // Theme
  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#3a7bd5',
      },
      secondary: {
        main: '#00d09c',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
    },
    typography: {
      fontFamily: "'Poppins', 'Roboto', 'Arial', sans-serif",
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  // Check server status on load
  useEffect(() => {
    const verifyBackendConnection = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/health');
        console.log("Backend health status:", response.data);
        setServerStatus(`Server is ${response.data.status}`);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Backend connection error:', err);
        setServerStatus('Server is down');
        setError('Cannot connect to the server. Please make sure the backend is running.');
        setLoading(false);
      }
    };

    verifyBackendConnection();
    
    // Try to restore wallet connection from localStorage
    const savedWalletAddress = localStorage.getItem('lastConnectedWallet');
    if (savedWalletAddress) {
      // Attempt to reconnect silently
      restoreWalletConnection(savedWalletAddress);
    }
  }, []);
  
  // Restore wallet connection
  const restoreWalletConnection = async (address) => {
    try {
      if (!walletService.getPhantomProvider()) {
        return; // Phantom not available
      }
      
      setWalletAddress(address);
      setWalletConnected(true);
      
      // Get balance
      try {
        const balance = await walletService.getSolanaBalance(address);
        setSolBalance(balance);
      } catch (error) {
        console.warn('Failed to restore wallet balance:', error);
        setSolBalance(0);
      }
    } catch (error) {
      console.warn('Failed to restore wallet connection:', error);
      localStorage.removeItem('lastConnectedWallet');
    }
  };

  // Load popular tokens
  const loadPopularTokens = async () => {
    try {
      setTokensLoading(true);
      const popularTokens = await tokenService.getPopularTokens();
      setTokens(popularTokens);
      setLastPriceUpdate(new Date());
      setTokensLoading(false);
    } catch (error) {
      console.error('Error loading popular tokens:', error);
      setTokensLoading(false);
    }
  };
  
  // Load trending meme coins
  const loadTrendingMemeCoins = async () => {
    try {
      setMemeCoinsLoading(true);
      const trendingMemeCoins = await tokenService.getTrendingMemeCoins();
      setMemeCoins(trendingMemeCoins);
      setMemeCoinsLoading(false);
    } catch (error) {
      console.error('Error loading trending meme coins:', error);
      setMemeCoinsLoading(false);
    }
  };
  
  // Load newly launched tokens
  const loadNewlyLaunchedTokens = async () => {
    try {
      setNewTokensLoading(true);
      
      if (!tokenService.getNewlyLaunchedTokens) {
        console.error('getNewlyLaunchedTokens function not available in tokenService');
        setNewTokens([]); // Set empty array to prevent UI errors
        setNewTokensLoading(false);
        return;
      }
      
      try {
        const response = await tokenService.getNewlyLaunchedTokens('solana', 10);
        
        if (response && response.status === 'success') {
          setNewTokens(response.data || []);
        } else {
          console.error('Error in new tokens response:', response);
          setNewTokens([]);
        }
      } catch (error) {
        console.error('Error loading newly launched tokens:', error);
        
        // Use fallback dummy data
        setNewTokens([
          {
            id: 'dummy-token-1',
            symbol: 'DUMMY1',
            name: 'Dummy Token 1',
            current_price: 0.000015,
            market_cap: 500000,
            image: 'https://via.placeholder.com/32/3a7bd5/FFFFFF?text=D1',
            price_change_percentage_since_launch: 75,
            initialLiquidity: 25000,
            launchTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            scamRisk: 'low'
          },
          {
            id: 'dummy-token-2',
            symbol: 'DUMMY2',
            name: 'Dummy Token 2',
            current_price: 0.000008,
            market_cap: 300000,
            image: 'https://via.placeholder.com/32/00d09c/FFFFFF?text=D2',
            price_change_percentage_since_launch: 120,
            initialLiquidity: 15000,
            launchTime: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            scamRisk: 'medium'
          }
        ]);
      }
    } finally {
      setNewTokensLoading(false);
    }
  };
  
  // Search for tokens
  const searchTokens = async (query) => {
    try {
      setTokensLoading(true);
      const results = await tokenService.searchTokens(query);
      setTokens(results);
      setTokensLoading(false);
    } catch (error) {
      console.error('Error searching tokens:', error);
      setTokensLoading(false);
    }
  };
  
  // Handle token selection for trading
  const handleTokenSelect = (token) => {
    setSelectedToken(token);
  };
  
  // Close trade dialog
  const handleCloseTradeDialog = () => {
    setSelectedToken(null);
  };
  
  // Execute a trade
  const executeTrade = async (tokenId, amount, type) => {
    if (!walletConnected || !walletAddress) {
      throw new Error('Wallet not connected');
    }
    
    // Execute the trade
    const result = await tokenService.executeTrade(tokenId, amount, type, walletAddress);
    
    // You could update some state here to show the trade was successful
    console.log('Trade executed:', result);
    
    return result;
  };
  
  // Update bot settings
  const updateBotSettings = async (settings) => {
    try {
      setBotSettings(settings);
      
      // If the bot is active, update the settings on the server
      if (botStatus === 'active') {
        console.log("Updating bot settings on server:", settings);
        const response = await axios.put(`${API_BASE_URL}/api/bot/settings`, settings);
        console.log("Settings update response:", response.data);
      }
      
      return settings;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  };
  
  // Load tokens and meme coins when component mounts
  useEffect(() => {
    loadPopularTokens();
    loadNewlyLaunchedTokens();
  }, []);
  
  // Load meme coins when tab changes to Trading
  useEffect(() => {
    if (tabValue === 1) {
      loadTrendingMemeCoins();
    }
  }, [tabValue]);
  
  // Set up monitoring for new token launches
  useEffect(() => {
    // Set up monitoring if wallet is connected and bot is active
    let unsubscribe;
    if (walletConnected && botStatus === 'active') {
      try {
        // Check if the function exists before calling it
        if (typeof tokenService.monitorNewLaunches === 'function') {
          unsubscribe = tokenService.monitorNewLaunches((newToken) => {
            console.log("New token detected:", newToken);
            // Add to the list and sort by launch time (newest first)
            setNewTokens(prev => {
              const updated = [newToken, ...prev];
              return updated.sort((a, b) => new Date(b.launchTime) - new Date(a.launchTime));
            });
          });
        } else {
          console.warn("monitorNewLaunches function is not available");
          // Create some dummy tokens to show functionality
          setTimeout(() => {
            const dummyToken = {
              id: `dummy-token-${Date.now()}`,
              symbol: 'dummy',
              name: 'Dummy Token',
              current_price: 0.00001,
              market_cap: 1000000,
              image: 'https://via.placeholder.com/32/2a5298/FFFFFF?text=DUMMY',
              price_change_percentage_since_launch: 100,
              initialLiquidity: 50000,
              launchTime: new Date().toISOString(),
              scamRisk: 'low'
            };
            
            setNewTokens(prev => {
              const updated = [dummyToken, ...prev];
              return updated.sort((a, b) => new Date(b.launchTime) - new Date(a.launchTime));
            });
          }, 10000);
        }
      } catch (error) {
        console.error("Error setting up token monitoring:", error);
      }
    }
    
    return () => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from token monitoring:", error);
        }
      }
    };
  }, [walletConnected, botStatus]);
  
  // Set up real-time price updates
  useEffect(() => {
    if (!tokens.length) return;
    
    // Subscribe to real-time updates
    const unsubscribe = tokenService.subscribeToRealTimeUpdates((update) => {
      setLastPriceUpdate(new Date());
      
      if (update.type === 'price_update' && update.tokens) {
        // Update the entire tokens array with fresh data
        setTokens(update.tokens);
      } else if (update.type === 'price_update' && update.updates) {
        // Handle legacy format (update individual tokens)
        setTokens(prevTokens => {
          return prevTokens.map(token => {
            const priceUpdate = update.updates.find(u => u.id === token.id);
            if (priceUpdate) {
              // Apply the price change
              const newPrice = token.current_price * (1 + priceUpdate.price_change / 100);
              
              return {
                ...token,
                current_price: newPrice,
                price_change_percentage_24h: 
                  (token.price_change_percentage_24h || 0) + priceUpdate.price_change
              };
            }
            return token;
          });
        });
      }
    });
    
    // Clean up subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [tokens]);

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Toggle bot status
  const toggleBot = async () => {
    setBotLoading(true);
    
    try {
      if (botStatus === 'active') {
        console.log("Attempting to stop the bot...");
        // Call API to stop bot
        const response = await axios.post(`${API_BASE_URL}/api/bot/stop`);
        console.log("Stop bot response:", response.data);
        
        if (response.data.status === 'success') {
          setBotStatus('inactive');
          console.log("Bot stopped successfully");
        } else {
          throw new Error(response.data.message || 'Failed to stop bot');
        }
      } else {
        console.log("Attempting to start the bot with wallet:", walletAddress);
        
        if (!walletAddress) {
          alert("Please connect your wallet first");
          setBotLoading(false);
          return;
        }
        
        // Call API to start bot with current settings
        const response = await axios.post(`${API_BASE_URL}/api/bot/start`, {
          walletAddress: walletAddress,
          settings: botSettings
        });
        
        console.log("Start bot response:", response.data);
        
        if (response.data.status === 'success') {
          setBotStatus('active');
          console.log("Bot started successfully");
        } else {
          throw new Error(response.data.message || 'Failed to start bot');
        }
      }
    } catch (error) {
      console.error("Toggle bot error:", error);
      
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      
      alert(`Failed to ${botStatus === 'active' ? 'stop' : 'start'} the bot. Please try again.`);
    } finally {
      setBotLoading(false);
    }
  };

  // Check bot status periodically
  const checkBotStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bot/status`);
      if (response.data.status === 'success') {
        const serverBotStatus = response.data.data.botStatus;
        if (serverBotStatus !== botStatus) {
          setBotStatus(serverBotStatus);
        }
      }
    } catch (error) {
      console.error("Error checking bot status:", error);
    }
  };

  // Set up periodic bot status check
  useEffect(() => {
    // Check bot status every 10 seconds
    const interval = setInterval(checkBotStatus, 10000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);

  // Connect wallet using Phantom
  const connectWallet = async () => {
    try {
      setWalletLoading(true);
      setError(null);
      
      // Check if Phantom is installed
      if (!walletService.isPhantomInstalled()) {
        alert("Phantom wallet is not installed. Please install it first.");
        window.open("https://phantom.app/", "_blank");
        setWalletLoading(false);
        return;
      }

      // Connect to wallet - this should trigger the Phantom popup
      console.log("Requesting wallet connection...");
      const { publicKey } = await walletService.connectWallet();
      console.log("Connection approved, public key:", publicKey);
      
      // Set wallet address
      setWalletAddress(publicKey);
      
      // Get balance from blockchain with retries
      try {
        console.log("Fetching balance from blockchain...");
        const balance = await walletService.getSolanaBalance(publicKey);
        console.log("Balance retrieved:", balance);
        setSolBalance(balance);
      } catch (balanceError) {
        console.error("Error fetching balance:", balanceError);
        // Continue with zero balance, the WalletBalance component will retry
        setSolBalance(0);
      }
      
      // Register with backend (with error handling)
      try {
        const result = await walletService.registerWalletWithBackend(publicKey);
        console.log("Backend registration result:", result);
      } catch (registerError) {
        console.error("Backend registration error:", registerError);
        // Continue even if backend registration fails
      }
      
      setWalletConnected(true);
      setWalletLoading(false);
      
      // Save wallet address to local storage for persistence
      localStorage.setItem('lastConnectedWallet', publicKey);
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      if (error.message && error.message.includes('User rejected')) {
        setError('Wallet connection was rejected by user.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
      
      setWalletLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      await walletService.disconnectWallet();
      
      setWalletConnected(false);
      setWalletAddress('');
      setSolBalance(0);
      
      // Remove from local storage
      localStorage.removeItem('lastConnectedWallet');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Refresh wallet balance
  const refreshWalletBalance = async () => {
    if (!walletConnected || !walletAddress) return;
    
    try {
      setWalletLoading(true);
      
      // Get balance from blockchain
      const balance = await walletService.getSolanaBalance(walletAddress);
      setSolBalance(balance);
      
      setWalletLoading(false);
    } catch (error) {
      console.error('Error refreshing wallet balance:', error);
      setWalletLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <ErrorDetector />
      <CssBaseline />
      <ErrorFinder />
      <ObjectErrorFinder />
      <ErrorDebugger /> {/* Add this line right after CssBaseline */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4,
            backgroundImage: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            color: 'white'
          }}
        >
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" fontWeight="bold">
                Crypto Sniper Bot
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                Automated trading assistant for cryptocurrency markets
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {serverStatus}
                </Typography>
                {!walletConnected ? (
                  <Button 
                    variant="contained" 
                    startIcon={<WalletIcon />}
                    onClick={connectWallet}
                    disabled={loading || walletLoading}
                  >
                    {walletLoading ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Wallet: {formatPublicKey ? formatPublicKey(walletAddress) : `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`} 
                      ({solBalance.toFixed(2)} SOL)
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="small"
                      onClick={disconnectWallet}
                      disabled={walletLoading}
                    >
                      Disconnect
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        ) : (
          <>
            <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
              <Tabs
                value={tabValue}
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
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <BotStatus 
                      walletConnected={walletConnected}
                      walletAddress={walletAddress}
                    />
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Recent Transactions</Typography>
                        <IconButton size="small">
                          <RefreshIcon />
                        </IconButton>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Alert severity="info">
                        No transactions available yet. Start the bot to begin trading.
                      </Alert>
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Trading Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  New Token Launches
                </Typography>
                
                {!walletConnected ? (
                  <Alert severity="info" sx={{ mb: 4 }}>
                    Connect your wallet to enable trading features.
                  </Alert>
                ) : (
                  <>
                    <NewLaunches
                      newCoins={newTokens}
                      loading={newTokensLoading}
                      onTradeClick={handleTokenSelect}
                      onRefresh={loadNewlyLaunchedTokens}
                    />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
                      <Typography variant="h6">Token Search</Typography>
                      <PriceUpdateIndicator lastUpdated={lastPriceUpdate} />
                    </Box>
                    
                    <TokenList
                      tokens={tokens}
                      loading={tokensLoading}
                      onSearch={searchTokens}
                      onRefresh={loadPopularTokens}
                      onTokenSelect={handleTokenSelect}
                    />
                    
                    <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                      Trending Meme Coins
                    </Typography>
                    
                    <MemeCoinList
                      memeCoins={memeCoins}
                      loading={memeCoinsLoading}
                      onTradeClick={handleTokenSelect}
                    />
                    
                    <TradeDialog
                      open={!!selectedToken}
                      onClose={handleCloseTradeDialog}
                      token={selectedToken}
                      onExecuteTrade={executeTrade}
                      walletBalance={solBalance}
                    />
                  </>
                )}
              </TabPanel>

              {/* Wallet Tab */}
              <TabPanel value={tabValue} index={2}>
                <WalletPage 
                  walletConnected={walletConnected}
                  walletAddress={walletAddress}
                  connectWallet={connectWallet}
                  disconnectWallet={disconnectWallet}
                />
              </TabPanel>
              
              {/* Settings Tab */}
              <TabPanel value={tabValue} index={3}>
                <TradingSettings 
                  initialSettings={botSettings}
                  onSaveSettings={updateBotSettings}
                />
              </TabPanel>
            </Paper>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;