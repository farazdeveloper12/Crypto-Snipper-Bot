// src/components/TokenChart.js
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, ComposedChart, Scatter
} from 'recharts';
import { 
  Box, 
  Paper, 
  Typography, 
  ButtonGroup, 
  Button,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import axios from 'axios';

// Placeholder data generator
const generatePlaceholderData = (days, volatility = 0.05) => {
  const data = [];
  let price = 100 + Math.random() * 10;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random price movement with some trend
    const change = (Math.random() - 0.5) * volatility * price;
    price += change;
    
    // Ensure price stays positive
    if (price < 0.000001) price = 0.000001;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: price,
      volume: Math.abs(change) * 1000000 * (Math.random() + 0.5)
    });
  }
  
  return data;
};

// Fetch real price data if available
const fetchTokenPriceHistory = async (tokenAddress, timeframe = '24h') => {
  try {
    // Try to get data from DexScreener
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    
    if (response.data && response.data.pairs && response.data.pairs.length > 0) {
      const pair = response.data.pairs[0];
      
      // Get price candles if available
      if (pair.priceCandles) {
        return pair.priceCandles.map(candle => ({
          date: new Date(candle.timestamp).toISOString().split('T')[0],
          price: parseFloat(candle.close),
          volume: candle.volume || 0
        }));
      }
    }
    
    // Fall back to placeholder data if no real data
    throw new Error('No price candles available');
  } catch (error) {
    console.warn('Using placeholder data for charts:', error);
    return generatePlaceholderData(30, 0.1);
  }
};

const TokenChart = ({ token }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');
  const [chartType, setChartType] = useState('line');
  
  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      try {
        if (token && token.id) {
          const data = await fetchTokenPriceHistory(token.id, timeframe);
          setChartData(data);
        } else {
          setChartData(generatePlaceholderData(30));
        }
      } catch (error) {
        console.error('Error loading chart data:', error);
        setChartData(generatePlaceholderData(30));
      } finally {
        setLoading(false);
      }
    };
    
    loadChartData();
  }, [token, timeframe]);
  
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };
  
  const handleChartTypeChange = (event, newValue) => {
    setChartType(newValue);
  };
  
  const formatPrice = (price) => {
    if (price < 0.01) return price.toExponential(4);
    return price.toFixed(2);
  };
  
  return (
    <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {token ? `${token.name} (${token.symbol})` : 'Token Price Chart'}
        </Typography>
        
        <ButtonGroup size="small">
          <Button 
            variant={timeframe === '24h' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeframeChange('24h')}
          >
            24H
          </Button>
          <Button 
            variant={timeframe === '7d' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeframeChange('7d')}
          >
            7D
          </Button>
          <Button 
            variant={timeframe === '30d' ? 'contained' : 'outlined'} 
            onClick={() => handleTimeframeChange('30d')}
          >
            30D
          </Button>
        </ButtonGroup>
      </Box>
      
      <Tabs value={chartType} onChange={handleChartTypeChange} sx={{ mb: 2 }}>
        <Tab value="line" label="Line" />
        <Tab value="area" label="Area" />
        <Tab value="bar" label="Bar" />
        <Tab value="combo" label="Combo" />
      </Tabs>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' && (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  domain={['auto', 'auto']} 
                  tickFormatter={formatPrice} 
                />
                <Tooltip 
                  formatter={(value) => ['$' + formatPrice(value), 'Price']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3a7bd5" 
                  activeDot={{ r: 8 }} 
                  name="Price" 
                />
              </LineChart>
            )}
            
            {chartType === 'area' && (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatPrice} />
                <Tooltip 
                  formatter={(value) => ['$' + formatPrice(value), 'Price']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3a7bd5" 
                  fill="#3a7bd5" 
                  fillOpacity={0.2} 
                  name="Price" 
                />
              </AreaChart>
            )}
            
            {chartType === 'bar' && (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatPrice} />
                <Tooltip 
                  formatter={(value) => ['$' + formatPrice(value), 'Price']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Bar dataKey="price" fill="#3a7bd5" name="Price" />
              </BarChart>
            )}
            
            {chartType === 'combo' && (
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" tickFormatter={formatPrice} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Price') return ['$' + formatPrice(value), 'Price'];
                    return [value.toLocaleString(), name];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="price" 
                  fill="#3a7bd5" 
                  stroke="#3a7bd5" 
                  fillOpacity={0.3} 
                  name="Price" 
                />
                <Bar 
                  yAxisId="right"
                  dataKey="volume" 
                  barSize={20} 
                  fill="#00d09c" 
                  name="Volume" 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="price" 
                  stroke="#ff7300" 
                  dot={false} 
                  activeDot={false}
                  name="Price Trend" 
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
};

export default TokenChart;