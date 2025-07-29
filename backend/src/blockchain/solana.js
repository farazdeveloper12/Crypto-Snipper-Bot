// backend/src/blockchain/solana.js
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Multiple RPC endpoints for redundancy
const SOLANA_RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.rpc.extrnode.com',
  'https://solana.public-rpc.com',
  'https://api.testnet.solana.com'
];

class SolanaService {
  constructor() {
    this.currentEndpointIndex = 0;
    this.connection = new Connection(SOLANA_RPC_ENDPOINTS[0], 'confirmed');
    this.setupConnectionRetry();
  }

  setupConnectionRetry() {
    this.testConnection().catch(error => {
      console.warn(`Initial Solana RPC connection failed, will try alternatives: ${error.message}`);
      this.rotateEndpoint();
    });
  }

  async testConnection() {
    try {
      await this.connection.getRecentBlockhash();
      console.log(`Connected to Solana RPC: ${SOLANA_RPC_ENDPOINTS[this.currentEndpointIndex]}`);
      return true;
    } catch (error) {
      throw error;
    }
  }

  rotateEndpoint() {
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % SOLANA_RPC_ENDPOINTS.length;
    const newEndpoint = SOLANA_RPC_ENDPOINTS[this.currentEndpointIndex];
    console.log(`Rotating to Solana RPC endpoint: ${newEndpoint}`);
    this.connection = new Connection(newEndpoint, 'confirmed');
  }

  async callWithRetry(method, ...args) {
    for (let attempt = 0; attempt < SOLANA_RPC_ENDPOINTS.length; attempt++) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        console.warn(`Attempt ${attempt + 1} failed: ${error.message}`);
        this.rotateEndpoint();
        
        // If this was the last attempt, rethrow the error
        if (attempt === SOLANA_RPC_ENDPOINTS.length - 1) {
          throw error;
        }
      }
    }
  }

  async getAccountBalance(publicKey) {
    return this.callWithRetry(async (pubKey) => {
      try {
        const balance = await this.connection.getBalance(new PublicKey(pubKey));
        return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
      } catch (error) {
        console.error('Solana balance fetch error:', error);
        throw error;
      }
    }, publicKey);
  }

  async getTokenInfo(tokenAddress) {
    return this.callWithRetry(async (tokenAddr) => {
      try {
        // This is a simplified placeholder
        return {
          address: tokenAddr,
          name: 'Unknown Token',
          symbol: 'UNK',
          decimals: 9
        };
      } catch (error) {
        console.error('Solana token info error:', error);
        throw error;
      }
    }, tokenAddress);
  }
}

module.exports = new SolanaService();