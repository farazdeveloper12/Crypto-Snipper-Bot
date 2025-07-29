// src/components/Wallet/ProxyWalletBalance.js
import React, { useState, useEffect } from 'react';

const ProxyWalletBalance = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3006/balance');
      const data = await response.json();
      
      if (data.status === 'success') {
        setBalance(data.data.balanceSol);
        setLastUpdated(new Date());
        console.log("Balance updated:", data.data.balanceSol);
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      borderRadius: '8px', 
      backgroundColor: '#1a365d', 
      color: 'white',
      marginTop: '20px',
      border: '2px solid #4a88f0'
    }}>
      <h2 style={{ color: '#4a88f0', marginTop: 0 }}>Live Wallet Balance</h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ 
            width: '30px', 
            height: '30px', 
            border: '4px solid rgba(255,255,255,0.3)', 
            borderRadius: '50%', 
            borderTopColor: 'white', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p>Loading balance...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div style={{ color: '#f56565', padding: '10px', backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: '4px' }}>
          Error: {error}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0' }}>
            {balance.toFixed(8)} SOL
          </div>
          <div style={{ color: '#a0aec0', marginBottom: '10px' }}>
            ≈ ${(balance * 20).toFixed(2)} USD
          </div>
          {lastUpdated && (
            <div style={{ fontSize: '12px', color: '#a0aec0' }}>
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
          padding: '10px 16px',
          borderRadius: '4px',
          marginTop: '15px',
          cursor: 'pointer',
          fontWeight: 'bold',
          width: '100%'
        }}
      >
        Refresh Balance
      </button>
    </div>
  );
};

export default ProxyWalletBalance;