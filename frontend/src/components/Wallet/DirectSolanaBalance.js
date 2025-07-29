import React, { useState, useEffect } from 'react';

const DirectSolanaBalance = () => {
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Your wallet address
  const walletAddress = '5h4sVsNhuxcqtaWP1XUTPUwQdDEbuuXBeN27fGgirap9';
  
  const fetchBalance = async () => {
    setIsLoading(true);
    try {
      // Direct call to Solana RPC
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress],
        }),
      });
      
      const data = await response.json();
      
      if (data.result) {
        // Convert from lamports to SOL
        const solBalance = data.result.value / 1_000_000_000;
        setBalance(solBalance);
        console.log('Balance retrieved:', solBalance);
      } else {
        throw new Error('Failed to retrieve balance');
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to load balance');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch on component mount
  useEffect(() => {
    fetchBalance();
    // Refresh every 15 seconds
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, []);
  
  if (error) {
    return (
      <div className="balance-error">
        Error loading balance. Please check console for details.
      </div>
    );
  }
  
  return (
    <div className="balance-container">
      <div className="balance-heading">Balance</div>
      <div className="balance-amount">
        {isLoading ? 'Loading...' : `${balance ? balance.toFixed(6) : '0.00'} SOL`}
      </div>
      <div className="balance-usd">
        ≈ ${balance ? (balance * 20).toFixed(2) : '0.00'} USD
      </div>
      <button 
        onClick={fetchBalance}
        style={{
          background: '#4a88f0',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          marginTop: '16px',
          cursor: 'pointer'
        }}
      >
        Refresh Balance
      </button>
    </div>
  );
};

export default DirectSolanaBalance;