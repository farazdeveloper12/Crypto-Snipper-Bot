// balance-server/balance-server-fixed.js
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');

const app = express();
app.use(cors());

const PORT = 3007; // Use a new port to avoid conflicts
const WALLET_ADDRESS = '5h4sVsNhuxcqtaWP1XUTPUwQdDEbuuXBeN27fGgirap9';

// Use a more reliable RPC endpoint
const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

app.get('/balance', async (req, res) => {
  console.log('Received balance request');
  
  // Try multiple RPC endpoints in case one fails
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      const connection = new Connection(endpoint, 'confirmed');
      const publicKey = new PublicKey(WALLET_ADDRESS);
      
      console.log('Fetching balance...');
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / 1000000000;
      
      console.log(`Balance retrieved: ${solBalance} SOL`);
      
      return res.json({
        status: 'success',
        data: {
          address: WALLET_ADDRESS,
          balanceLamports: balance,
          balanceSol: solBalance,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(`Error with endpoint ${endpoint}:`, error.message);
      // Continue to the next endpoint
    }
  }
  
  // If all endpoints failed
  res.status(500).json({
    status: 'error',
    message: 'Failed to fetch balance from all available endpoints'
  });
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Balance server running on port ${PORT}`);
  console.log(`Access balance at: http://localhost:${PORT}/balance`);
  console.log(`Health check at: http://localhost:${PORT}/health`);
});