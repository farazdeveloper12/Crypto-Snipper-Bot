// frontend/src/hooks/useWallet.js
import { useState, useEffect } from 'react';
import { addWallet } from '../services/api';

export const useWallet = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = async (blockchain) => {
    setLoading(true);
    try {
      // Implement wallet connection logic
      // This might involve MetaMask for Ethereum or Phantom for Solana
      const walletData = await connectBlockchainWallet(blockchain);
      
      // Save wallet to backend
      const savedWallet = await addWallet(walletData);
      
      setWallets(prev => [...prev, savedWallet]);
      setLoading(false);
      return savedWallet;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  const disconnectWallet = (walletId) => {
    setWallets(prev => prev.filter(wallet => wallet.id !== walletId));
  };

  return {
    wallets,
    loading,
    error,
    connectWallet,
    disconnectWallet
  };
};

// Placeholder for blockchain-specific wallet connection
const connectBlockchainWallet = async (blockchain) => {
  switch(blockchain) {
    case 'ethereum':
      return connectEthereumWallet();
    case 'solana':
      return connectSolanaWallet();
    default:
      throw new Error('Unsupported blockchain');
  }
};

const connectEthereumWallet = async () => {
  // MetaMask connection logic
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      return {
        blockchain: 'ethereum',
        address: accounts[0]
      };
    } catch (error) {
      console.error('Ethereum wallet connection failed', error);
      throw error;
    }
  } else {
    throw new Error('MetaMask not found');
  }
};

const connectSolanaWallet = async () => {
  // Phantom wallet connection logic
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      return {
        blockchain: 'solana',
        address: resp.publicKey.toString()
      };
    } catch (error) {
      console.error('Solana wallet connection failed', error);
      throw error;
    }
  } else {
    throw new Error('Phantom wallet not found');
  }
};