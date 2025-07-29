// src/components/Wallet/EmergencyBalance.js
import React, { useState, useEffect } from 'react';

function EmergencyBalance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  // The hardcoded wallet address from your screenshots
  const walletAddress = '5h4sVsNhuxcqtaWP1XUTPUwQdDEbuuXBeN27fGgirap9';

  const fetchDirectBalance = async () => {
    setLoading(true);
    try {
      // Using the Solana public JSON RPC directly
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress]
        })
      });

      const data = await response.json();
      if (data.result && data.result.value !== undefined) {
        // Convert lamports to SOL
        const solBalance = data.result.value / 1000000000;
        setBalance(solBalance);
      } else {
        console.error('Invalid response:', data);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectBalance();
    const interval = setInterval(fetchDirectBalance, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      padding: '15px', 
      backgroundColor: '#2c3e50', 
      color: 'white', 
      borderRadius: '8px',
      marginTop: '20px'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Emergency Balance Check</h3>
      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
        {loading ? 'Loading...' : balance !== null ? `${balance.toFixed(8)} SOL` : 'Error'}
      </div>
      <button 
        onClick={fetchDirectBalance}
        style={{
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          padding: '8px 15px',
          borderRadius: '4px',
          marginTop: '15px',
          cursor: 'pointer'
        }}
      >
        Refresh
      </button>
    </div>
  );
}

export default EmergencyBalance;