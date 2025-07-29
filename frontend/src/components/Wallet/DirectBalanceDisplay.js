// frontend/src/components/Wallet/DirectBalanceDisplay.js
import React, { useState, useEffect } from 'react';

const DirectBalanceDisplay = ({ walletAddress }) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      // Try multiple reliable Solana RPC endpoints
      const endpoints = [
        'https://solana-api.projectserum.com',
        'https://rpc.ankr.com/solana',
        'https://ssc-dao.genesysgo.net'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getBalance',
              params: [walletAddress]
            })
          });
          
          const data = await response.json();
          if (data.result) {
            // Convert lamports to SOL
            const solBalance = data.result.value / 1000000000;
            setBalance(solBalance);
            setLoading(false);
            return;
          }
        } catch (endpointError) {
          console.warn(`Endpoint ${endpoint} failed:`, endpointError);
          // Try next endpoint
        }
      }
      
      // If all endpoints failed
      setLoading(false);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [walletAddress]);
  
  return (
    <div>
      <div>Balance</div>
      <h2>{loading ? 'Loading...' : `${balance.toFixed(8)} SOL`}</h2>
      <div style={{ color: '#777777' }}>
        ≈ ${(balance * 20).toFixed(2)} USD
      </div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={fetchBalance}>Refresh</button>
      </div>
    </div>
  );
};

export default DirectBalanceDisplay;