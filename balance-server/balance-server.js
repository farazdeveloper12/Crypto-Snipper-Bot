const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');

const app = express();
app.use(cors());

const PORT = 3005;
const WALLET_ADDRESS = '5h4sVsNhuxcqtaWP1XUTPUwQdDEbuuXBeN27fGgirap9';

app.get('/balance', async (req, res) => {
  try {
    console.log('Fetching balance for', WALLET_ADDRESS);
    
    // Connect to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Get balance
    const publicKey = new PublicKey(WALLET_ADDRESS);
    const balance = await connection.getBalance(publicKey);
    
    // Convert to SOL
    const solBalance = balance / 1000000000;
    
    console.log('Balance retrieved:', solBalance, 'SOL');
    
    // Send response
    res.json({
      status: 'success',
      data: {
        address: WALLET_ADDRESS,
        balanceLamports: balance,
        balanceSol: solBalance
      }
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch balance',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Balance server running on port ${PORT}`);
  console.log(`Access balance at: http://localhost:${PORT}/balance`);
});