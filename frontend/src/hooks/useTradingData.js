// frontend/src/hooks/useTradingData.js
import { useState, useEffect } from 'react';
import { getTradeHistory, executeSnipe } from '../services/api';

export const useTradingData = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTradeHistory = async (params = {}) => {
    setLoading(true);
    try {
      const data = await getTradeHistory(params);
      setTrades(data.trades);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const performSnipe = async (tradeData) => {
    setLoading(true);
    try {
      const result = await executeSnipe(tradeData);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  return {
    trades,
    loading,
    error,
    fetchTradeHistory,
    performSnipe
  };
};