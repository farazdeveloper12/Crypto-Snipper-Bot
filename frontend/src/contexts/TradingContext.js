// src/context/TradingContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios'; // Make sure axios is installed

export const TradingContext = createContext();

export const TradingProvider = ({ children }) => {
  const [botStatus, setBotStatus] = useState('inactive');
  const [tradingSettings, setTradingSettings] = useState({
    maxTrade: 0.01, // Changed default from 0.1 to 0.01
    slippage: 3,
    autoTakeProfit: 50,
    autoStopLoss: 10,
    trailingStopLoss: false,
    scamCheck: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch bot status on initial load
  useEffect(() => {
    const fetchBotStatus = async () => {
      try {
        const response = await axios.get('/api/bot/status');
        if (response.data && response.data.status === 'success') {
          setBotStatus(response.data.botStatus || 'inactive');
          
          // If there are settings in the response, update our local settings
          if (response.data.settings) {
            setTradingSettings(prevSettings => ({
              ...prevSettings,
              maxTrade: response.data.settings.maxTradeAmount || response.data.settings.maxTrade || 0.01,
              slippage: response.data.settings.slippage || 3,
              autoTakeProfit: response.data.settings.takeProfit || response.data.settings.autoTakeProfit || 50,
              autoStopLoss: response.data.settings.stopLoss || response.data.settings.autoStopLoss || 10,
              trailingStopLoss: response.data.settings.trailingStopLoss || false,
              scamCheck: response.data.settings.scamDetection || response.data.settings.scamCheck || true,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching bot status:', error);
      }
    };
    
    fetchBotStatus();
    
    // Set up a polling interval to check status regularly
    const statusInterval = setInterval(fetchBotStatus, 10000); // Every 10 seconds
    
    return () => clearInterval(statusInterval);
  }, []);

  // Start bot function
  const startBot = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert settings for the API
      const backendSettings = {
        maxTradeAmount: tradingSettings.maxTrade,
        slippage: tradingSettings.slippage,
        takeProfit: tradingSettings.autoTakeProfit,
        stopLoss: tradingSettings.autoStopLoss,
        scamDetection: tradingSettings.scamCheck,
        trailingStopLoss: tradingSettings.trailingStopLoss
      };
      
      // Get wallet address - you'll need to implement this based on your app's wallet integration
      const walletAddress = localStorage.getItem('walletAddress') || '';
      
      // Make API call to start bot
      const response = await axios.post('/api/bot/start', {
        ...backendSettings,
        walletAddress
      });
      
      if (response.data && response.data.status === 'success') {
        setBotStatus('active');
        
        // Also make a direct call to set trade size
        await axios.post('/api/bot/set-trade-size', {
          tradeSize: tradingSettings.maxTrade.toString()
        });
        
        return true;
      } else {
        setError(response.data?.message || 'Failed to start bot');
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start bot');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Stop bot function
  const stopBot = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make API call to stop bot
      const response = await axios.post('/api/bot/stop');
      
      if (response.data && response.data.status === 'success') {
        setBotStatus('inactive');
        return true;
      } else {
        setError(response.data?.message || 'Failed to stop bot');
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop bot');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update settings function
  const updateSettings = async (newSettings) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert settings for the API
      const backendSettings = {
        maxTradeAmount: newSettings.maxTrade,
        slippage: newSettings.slippage,
        takeProfit: newSettings.autoTakeProfit,
        stopLoss: newSettings.autoStopLoss,
        scamDetection: newSettings.scamCheck,
        trailingStopLoss: newSettings.trailingStopLoss
      };
      
      console.log("Sending settings to backend:", backendSettings);
      
      // Make API call to update settings
      const response = await axios.post('/api/bot/settings', backendSettings);
      
      if (response.data && response.data.status === 'success') {
        setTradingSettings(newSettings);
        
        // Also make a direct call to set trade size
        await axios.post('/api/bot/set-trade-size', {
          tradeSize: newSettings.maxTrade.toString()
        });
        
        return true;
      } else {
        setError(response.data?.message || 'Failed to update settings');
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <TradingContext.Provider
      value={{
        botStatus,
        tradingSettings,
        loading,
        error,
        startBot,
        stopBot,
        updateSettings,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};