// src/components/Wallet/DirectWeb3Balance.js
import React, { useState, useEffect } from 'react';

const DirectWeb3Balance = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const walletAddress = '5h4sVsNhuxcqtaWP1XUTPUwQdDEbuuXBeN27fGgirap9';
  
  const fetchBalanceDirectly = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use alternative public endpoints to avoid the 403 errors
      const endpoints = [
        'https://solana-mainnet.g.alchemy.com/v2/demo',
        'https://rpc.ankr.com/solana',
        'https://solana-api.projectserum.com'
      ];
      
      let balance = null;
      let success = false;
      
      // Try each endpoint until one succeeds
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
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
          
          if (data.result !== undefined) {
            // Convert lamports to SOL
            balance = data.result.value / 1000000000;
            success = true;
            break;
          }
        } catch (innerError) {
          console.warn(`Endpoint ${endpoint} failed:`, innerError);
          // Continue to next endpoint
        }
      }
      
      if (success) {
        setBalance(balance);
        console.log('Balance successfully retrieved:', balance);
      } else {
        throw new Error('All endpoints failed to retrieve balance');
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBalanceDirectly();
    
    const interval = setInterval(() => {
      fetchBalanceDirectly();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#1f3a60',
        borderRadius: '8px',
        color: 'white' 
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Direct Balance Check</h3>
        
        {loading ? (
          <div>Loading balance...</div>
        ) : error ? (
          <div style={{ color: '#ff6b6b' }}>
            Error: {error}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
              {balance.toFixed(8)} SOL
            </div>
            <div style={{ color: '#aaaaaa' }}>
              ≈ ${(balance * 20).toFixed(2)} USD
            </div>
          </div>
        )}
        
        <button 
          onClick={fetchBalanceDirectly}
          style={{
            backgroundColor: '#4a88f0',
            color: 'white',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '4px',
            marginTop: '10px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Refresh Balance
        </button>
      </div>
    </div>
  );
};

export default DirectWeb3Balance;