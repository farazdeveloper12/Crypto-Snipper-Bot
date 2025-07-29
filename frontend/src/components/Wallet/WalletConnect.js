// src/components/Wallet/WalletConnect.js
import React, { useState, useEffect } from 'react';
import DirectWalletDisplay from './DirectWalletDisplay';

const WalletConnect = () => {
  const [walletAddress, setWalletAddress] = useState('');
  
  // Get wallet from previous connection or localStorage
  useEffect(() => {
    // Try to get from localStorage first (if stored previously)
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setWalletAddress(savedAddress);
    } else {
      // Default to your connected wallet address
      setWalletAddress('5h4sVsNhuxcqtaWP1XUTPUwQdDEbuuXBeN27fGgirap9');
    }
  }, []);
  
  const handleDisconnect = () => {
    setWalletAddress('');
    localStorage.removeItem('walletAddress');
    // Optionally trigger any other disconnect logic you need
  };
  
  return (
    <div className="wallet-container">
      <h2>Wallet Integration</h2>
      
      <div className="wallet-address-container" style={{ 
        padding: '16px', 
        backgroundColor: '#1c1c1c', 
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        <div>Connected Wallet</div>
        <div>{walletAddress}</div>
      </div>
      
      <DirectWalletDisplay walletAddress={walletAddress} />
      
      <button
        onClick={handleDisconnect}
        style={{
          backgroundColor: 'transparent',
          color: '#e74c3c',
          border: '1px solid #e74c3c',
          padding: '10px 20px',
          borderRadius: '4px',
          marginTop: '16px',
          cursor: 'pointer'
        }}
      >
        Disconnect Wallet
      </button>
    </div>
  );
};

export default WalletConnect;