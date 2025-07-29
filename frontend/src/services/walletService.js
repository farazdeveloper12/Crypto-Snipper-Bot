// src/services/walletService.js
import axios from 'axios';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

// Multiple RPC endpoints for redundancy
const SOLANA_RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.rpc.extrnode.com',
  'https://solana.public-rpc.com',
  'https://api.testnet.solana.com' // Fallback to testnet for development
];

// Get a working Solana RPC connection
const getWorkingSolanaConnection = async () => {
  for (const endpoint of SOLANA_RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, 'confirmed');
      // Test the connection with a simple call
      await connection.getRecentBlockhash();
      console.log(`Connected to Solana RPC: ${endpoint}`);
      return connection;
    } catch (error) {
      console.warn(`RPC endpoint ${endpoint} failed, trying next...`);
    }
  }
  throw new Error('All Solana RPC endpoints failed');
};

// Get Phantom provider, handling both possible locations
export const getPhantomProvider = () => {
  if (window.phantom?.solana?.isPhantom) {
    return window.phantom.solana;
  }
  if (window.solana?.isPhantom) {
    return window.solana;
  }
  return null;
};

// Check if Phantom wallet is installed
export const isPhantomInstalled = () => {
  return !!getPhantomProvider();
};

// Connect to Phantom wallet
export const connectWallet = async () => {
  try {
    const provider = getPhantomProvider();
    
    if (!provider) {
      throw new Error('Phantom wallet not installed');
    }
    
    // This should trigger a popup from Phantom requesting approval
    const response = await provider.connect({ onlyIfTrusted: false });
    const publicKey = response.publicKey.toString();
    
    console.log('Connected to wallet:', publicKey);
    
    return { 
      success: true, 
      publicKey 
    };
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    throw error;
  }
};

// Disconnect from Phantom wallet
export const disconnectWallet = async () => {
  try {
    const provider = getPhantomProvider();
    
    if (!provider) {
      throw new Error('Phantom wallet not installed');
    }
    
    await provider.disconnect();
    
    console.log('Disconnected from wallet');
    
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting from wallet:', error);
    throw error;
  }
};

// Register wallet with backend
export const registerWalletWithBackend = async (address, chain = 'solana') => {
  try {
    // Skip backend registration in development if the backend is not available
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/wallet/connect`, {
          address,
          chain
        });
        
        console.log('Backend registration response:', response.data);
        return response.data;
      } catch (error) {
        console.warn('Backend registration failed in development mode, continuing...');
        return { success: true, message: 'Development mode - backend registration skipped' };
      }
    } else {
      const response = await axios.post(`${API_BASE_URL}/api/wallet/connect`, {
        address,
        chain
      });
      
      console.log('Backend registration response:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error registering wallet with backend:', error);
    throw error;
  }
};

// Get SOL balance directly from blockchain with fallback mechanisms
// In getSolanaBalance function of walletService.js
export const getSolanaBalance = async (publicKey) => {
  try {
    // Use a public Solana mainnet RPC endpoint
    const solanaRPCEndpoints = [
      'https://api.mainnet-beta.solana.com',
      'https://ssc-dao.genesysgo.net',
      'https://solana-api.projectserum.com'
    ];
    
    // Try each endpoint until one works
    for (const endpoint of solanaRPCEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [publicKey]
          })
        });
        
        const data = await response.json();
        
        if (data.result && typeof data.result.value === 'number') {
          // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
          const solBalance = data.result.value / 1000000000;
          console.log(`Retrieved SOL balance from ${endpoint}:`, solBalance);
          return solBalance;
        }
      } catch (endpointError) {
        console.warn(`Failed with endpoint ${endpoint}:`, endpointError);
        // Continue to next endpoint
      }
    }
    
    throw new Error('All endpoints failed');
  } catch (error) {
    console.error('Error getting balance from blockchain:', error);
    throw error;
  }
};

const walletService = {
  getPhantomProvider,
  isPhantomInstalled,
  connectWallet,
  disconnectWallet,
  registerWalletWithBackend,
  getSolanaBalance
};

export default walletService;