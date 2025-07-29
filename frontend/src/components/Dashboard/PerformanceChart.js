// src/components/Dashboard/PerformanceChart.js
import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Mock data
const data = [
  { date: '2023-01-01', profit: 120, transactions: 3 },
  { date: '2023-01-02', profit: 145, transactions: 4 },
  { date: '2023-01-03', profit: 135, transactions: 2 },
  { date: '2023-01-04', profit: 190, transactions: 5 },
  { date: '2023-01-05', profit: 210, transactions: 3 },
  { date: '2023-01-06', profit: 180, transactions: 2 },
  { date: '2023-01-07', profit: 250, transactions: 6 },
];

const PerformanceChart = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey="date" 
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary }}
          />
          <YAxis 
            yAxisId="left" 
            stroke={theme.palette.primary.main}
            tick={{ fill: theme.palette.text.secondary }}
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke={theme.palette.secondary.main}
            tick={{ fill: theme.palette.text.secondary }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 8
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="profit"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 3 }}
            name="Profit ($)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="transactions"
            stroke={theme.palette.secondary.main}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 3 }}
            name="Transactions"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PerformanceChart;