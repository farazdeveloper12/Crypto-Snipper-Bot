// src/components/BotActivityMonitor.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Badge,
  Button,
  IconButton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const activityTypes = {
  scan: { icon: <SearchIcon color="info" />, color: 'info' },
  buy: { icon: <TrendingUpIcon color="success" />, color: 'success' },
  sell: { icon: <TrendingDownIcon color="error" />, color: 'error' },
  error: { icon: <ErrorOutlineIcon color="error" />, color: 'error' },
  info: { icon: <LocalActivityIcon color="info" />, color: 'info' },
  success: { icon: <CheckCircleOutlineIcon color="success" />, color: 'success' }
};

// Simulate bot activities
const generateBotActivities = (count = 10) => {
  const activities = [];
  const now = new Date();
  
  const activityMessages = [
    { type: 'scan', message: 'Scanning for new token launches' },
    { type: 'scan', message: 'Monitoring token prices' },
    { type: 'info', message: 'New token detected: {token}' },
    { type: 'info', message: 'Analyzing token contract: {token}' },
    { type: 'error', message: 'Scam token detected: {token}' },
    { type: 'buy', message: 'Bought {amount} {token} at {price}' },
    { type: 'sell', message: 'Sold {amount} {token} at {price}' },
    { type: 'success', message: 'Take profit triggered for {token}' },
    { type: 'error', message: 'Stop loss triggered for {token}' },
    { type: 'info', message: 'Waiting for optimal entry point for {token}' }
  ];
  
  const tokenNames = ['PEPE', 'DOGE', 'SHIB', 'BONK', 'FLOKI', 'WOJAK', 'MOON', 'ELON'];
  
  for (let i = 0; i < count; i++) {
    const minutesAgo = Math.floor(Math.random() * 60);
    const timestamp = new Date(now);
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
    
    const template = activityMessages[Math.floor(Math.random() * activityMessages.length)];
    const tokenName = tokenNames[Math.floor(Math.random() * tokenNames.length)];
    
    const amount = (Math.random() * 10000).toFixed(2);
    const price = (Math.random() * 0.001).toFixed(8);
    
    // Replace placeholders in message
    let message = template.message
      .replace('{token}', tokenName)
      .replace('{amount}', amount)
      .replace('{price}', `$${price}`);
    
    activities.push({
      id: `activity-${Date.now()}-${i}`,
      type: template.type,
      message,
      timestamp
    });
  }
  
  // Sort by timestamp (newest first)
  return activities.sort((a, b) => b.timestamp - a.timestamp);
};

const BotActivityMonitor = ({ botStatus }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newActivities, setNewActivities] = useState(0);
  
  const loadActivities = () => {
    setLoading(true);
    
    // In a real application, this would fetch from your backend API
    setTimeout(() => {
      setActivities(generateBotActivities(20));
      setLoading(false);
      setNewActivities(0);
    }, 500);
  };
  
  useEffect(() => {
    loadActivities();
  }, []);
  
  useEffect(() => {
    let interval;
    
    if (botStatus === 'active') {
      interval = setInterval(() => {
        // Simulate new activities coming in
        if (Math.random() < 0.5) {
          const newActivity = generateBotActivities(1)[0];
          setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
          setNewActivities(prev => prev + 1);
        }
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [botStatus]);
  
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          Bot Activity
          {newActivities > 0 && (
            <Badge color="primary" badgeContent={newActivities} sx={{ ml: 1 }} />
          )}
        </Typography>
        <IconButton size="small" onClick={loadActivities} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : activities.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          No activities recorded yet. Start the bot to begin monitoring.
        </Typography>
      ) : (
        <List sx={{ overflow: 'auto', flexGrow: 1 }}>
          {activities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem>
                <Box sx={{ mr: 2 }}>
                  {activityTypes[activity.type]?.icon || <LocalActivityIcon color="action" />}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{activity.message}</Typography>
                      <Chip
                        label={formatTimestamp(activity.timestamp)}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1, fontSize: '0.65rem' }}
                      />
                    </Box>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default BotActivityMonitor;