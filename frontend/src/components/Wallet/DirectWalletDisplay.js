// src/components/Wallet/DirectWalletDisplay.js
import React, { useState, useEffect } from 'react';

const DirectWalletDisplay = ({ walletAddress }) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // The function that directly calls Solana's RPC
  const fetchSolanaBalance = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress]
        })
      });
      
      const result = await response.json();
      
      if (result && result.result && typeof result.result.value === 'number') {
        // Convert lamports to SOL
        const solBalance = result.result.value / 1_000_000_000;
        console.log(`Solana RPC returned balance: ${solBalance} SOL`);
        setBalance(solBalance);
        setLastUpdated(new Date());
      } else {
        console.error('Invalid RPC response:', result);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and set up refresh interval
  useEffect(() => {
    if (walletAddress) {
      fetchSolanaBalance();
      
      // Refresh every 10 seconds
      const intervalId = setInterval(fetchSolanaBalance, 10000);
      return () => clearInterval(intervalId);
    }
  }, [walletAddress]);

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>Balance</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
        {loading ? (
          <span>Loading...</span>
        ) : (
          <span>{balance.toFixed(8)} SOL</span>
        )}
      </div>
      <div style={{ color: '#aaaaaa', marginBottom: '16px' }}>
        ≈ ${(balance * 20).toFixed(6)} USD
      </div>
      {lastUpdated && (
        <div style={{ fontSize: '12px', color: '#aaaaaa', marginBottom: '16px' }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
      <button
        onClick={fetchSolanaBalance}
        style={{
          backgroundColor: '#e74c3c',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        Refresh Balance
      </button>
    </div>
  );
};

export default DirectWalletDisplay;