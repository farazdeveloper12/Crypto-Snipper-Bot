// frontend/src/components/Wallet/DirectBalanceDisplay.js
import React, { useState, useEffect } from 'react';

const DirectBalanceDisplay = ({ walletAddress }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the direct endpoint with timestamp to prevent caching
      const response = await fetch(
        `http://localhost:5002/direct-balance/${walletAddress}?_=${Date.now()}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Balance data:', data);
      
      if (data.status === 'success' && data.data) {
        setBalance(data.data.balanceSol);
        setLastUpdated(new Date());
      } else {
        setError(data.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and set up interval for updates
  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
      
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  return (
    <div style={{ 
      backgroundColor: '#2a2a2a', 
      padding: '16px', 
      borderRadius: '8px',
      marginTop: '16px' 
    }}>
      <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px' }}>
        Direct Balance Check
      </h3>
      
      <div style={{ color: '#fff', marginBottom: '8px' }}>
        {loading ? (
          'Loading balance...'
        ) : balance !== null ? (
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {balance.toFixed(8)} SOL
          </div>
        ) : (
          'Balance not available'
        )}
      </div>
      
      {error && (
        <div style={{ color: '#ff6b6b', marginTop: '8px', fontSize: '14px' }}>
          Error: {error}
        </div>
      )}
      
      {lastUpdated && (
        <div style={{ color: '#aaa', fontSize: '12px', marginTop: '8px' }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
      
      <button
        onClick={fetchBalance}
        disabled={loading}
        style={{
          backgroundColor: '#4a88f0',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          marginTop: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Refreshing...' : 'Refresh Balance'}
      </button>
    </div>
  );
};

export default DirectBalanceDisplay;