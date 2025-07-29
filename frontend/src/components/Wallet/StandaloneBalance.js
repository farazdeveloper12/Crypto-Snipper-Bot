// src/components/Wallet/StandaloneBalance.js
import React, { useState, useEffect } from 'react';

const StandaloneBalance = () => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      // Add cache-busting query parameter
      const response = await fetch(`http://localhost:3007/balance?t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Balance data:', data);
      
      if (data.status === 'success' && data.data) {
        setBalance(data.data.balanceSol);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError('Failed to load balance. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      backgroundColor: '#1a1a1a', 
      padding: '20px', 
      borderRadius: '8px',
      border: '1px solid #333',
      marginTop: '20px'
    }}>
      <h3 style={{ 
        color: '#4a88f0', 
        marginTop: 0, 
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        Direct Wallet Balance
      </h3>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading balance...</p>
        </div>
      ) : error ? (
        <div style={{ 
          color: '#ff6b6b', 
          padding: '10px', 
          backgroundColor: 'rgba(255,0,0,0.1)', 
          borderRadius: '4px'
        }}>
          {error}
        </div>
      ) : (
        <div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            margin: '10px 0',
            color: '#fff'
          }}>
            {balance.toFixed(8)} SOL
          </div>
          <div style={{ 
            color: '#888', 
            marginBottom: '10px'
          }}>
            ≈ ${(balance * 20).toFixed(2)} USD
          </div>
          {lastUpdated && (
            <div style={{ 
              fontSize: '12px', 
              color: '#666'
            }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
      
      <button 
        onClick={fetchBalance}
        style={{
          backgroundColor: '#4a88f0',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          marginTop: '15px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Refresh Balance
      </button>
    </div>
  );
};

export default StandaloneBalance;