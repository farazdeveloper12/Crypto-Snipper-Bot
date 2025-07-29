// src/services/walletService.js
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import logger from '../utils/logger.js';

class WalletService {
  constructor() {
    this.connection = null;
    this.walletPubkey = null;
    this.owner = null;
    this.walletBalances = new Map();
    this.rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  }

  async initialize() {
    try {
      this.connection = new Connection(this.rpcUrl, 'confirmed');
      
      // Load wallet private key from .env
      const privateKey = process.env.WALLET_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('WALLET_PRIVATE_KEY not set in .env');
      }

      // Validate private key format before parsing
      if (!/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(privateKey)) {
        throw new Error('WALLET_PRIVATE_KEY contains invalid characters. It must be in base58 format.');
      }

      // Generate keypair
      logger.info('Generating keypair from private key...');
      const decoded = this.parsePrivateKey(privateKey);
      this.owner = Keypair.fromSecretKey(decoded);
      this.walletPubkey = this.owner.publicKey;

      logger.info(`Wallet service initialized with Solana connection. Wallet: ${this.walletPubkey.toBase58()}`);
      return true;
    } catch (error) {
      logger.error(`Failed to initialize wallet service: ${error.message}`);
      throw error;
    }
  }

  async connectWallet(publicKeyStr) {
    try {
      const publicKey = new PublicKey(publicKeyStr);
      
      if (!publicKey.equals(this.walletPubkey)) {
        throw new Error('Provided public key does not match the initialized wallet');
      }
      
      const balance = await this.getWalletBalance(publicKeyStr);
      
      logger.info(`Connected to wallet: ${publicKeyStr} with balance: ${balance.balanceSol} SOL`);
      
      return {
        success: true,
        wallet: {
          publicKey: publicKeyStr,
          balance: balance.balanceSol
        }
      };
    } catch (error) {
      logger.error(`Failed to connect wallet: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fetchBalanceWithRetry(publicKey, maxRetries = 5) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (i > 0) {
          logger.info(`Retrying balance fetch (attempt ${i+1}/${maxRetries})`);
        }
        const balance = await this.connection.getBalance(publicKey, 'confirmed');
        return balance;
      } catch (error) {
        lastError = error;
        logger.warn(`Balance fetch error (attempt ${i+1}/${maxRetries}): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    throw lastError || new Error(`Failed to fetch balance after ${maxRetries} attempts`);
  }

  async getWalletBalance(publicKeyStr) {
    try {
      if (!this.connection) {
        await this.initialize();
      }
      
      const publicKey = new PublicKey(publicKeyStr);
      const balance = await this.fetchBalanceWithRetry(publicKey);
      const solBalance = balance / 1_000_000_000; // Convert lamports to SOL
      
      this.walletBalances.set(publicKeyStr, {
        balanceLamports: balance,
        balanceSol: solBalance,
        lastUpdated: new Date()
      });
      
      logger.info(`[WALLET] Raw balance returned: ${balance} lamports`);
      logger.info(`[WALLET] Final SOL balance: ${solBalance}`);
      
      return {
        address: publicKeyStr,
        balanceLamports: balance,
        balanceSol: solBalance
      };
    } catch (error) {
      logger.error(`[WALLET] RPC error fetching balance: ${error.message}`);
      
      if (this.walletBalances.has(publicKeyStr)) {
        const cachedBalance = this.walletBalances.get(publicKeyStr);
        logger.warn(`Using cached balance from ${cachedBalance.lastUpdated}`);
        return {
          address: publicKeyStr,
          balanceLamports: cachedBalance.balanceLamports,
          balanceSol: cachedBalance.balanceSol,
          fromCache: true
        };
      }
      
      throw error;
    }
  }

  async signTransaction(transaction) {
    try {
      if (!this.owner) {
        throw new Error('Wallet not initialized');
      }

      transaction.recentBlockhash = (await this.connection.getLatestBlockhash('confirmed')).blockhash;
      transaction.feePayer = this.owner.publicKey;
      transaction.sign(this.owner);
      
      return transaction.serialize();
    } catch (error) {
      logger.error(`Failed to sign transaction: ${error.message}`);
      throw error;
    }
  }

  parsePrivateKey(privateKeyString) {
    try {
      if (typeof privateKeyString === 'string') {
        if (privateKeyString.startsWith('[') && privateKeyString.endsWith(']')) {
          return new Uint8Array(JSON.parse(privateKeyString));
        }
        
        // Validate base58 format
        const decoded = bs58.decode(privateKeyString);
        if (decoded.length !== 64) {
          throw new Error(`Invalid private key length after base58 decoding: ${decoded.length}. Expected 64 bytes.`);
        }
        return decoded;
      }
      
      if (Array.isArray(privateKeyString)) {
        return new Uint8Array(privateKeyString);
      }
      
      throw new Error('Unsupported private key format');
    } catch (error) {
      logger.error(`Failed to parse private key: ${error.message}`);
      throw error;
    }
  }

  async getRecentTrades(publicKeyStr) {
    try {
      const publicKey = new PublicKey(publicKeyStr);
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 10 });
      const trades = [];

      for (const sig of signatures) {
        const tx = await this.connection.getTransaction(sig.signature, { commitment: 'confirmed' });
        if (tx && tx.meta && tx.meta.logMessages) {
          const isBuy = tx.meta.logMessages.some(msg => msg.includes('Swap') && msg.includes('SOL'));
          if (isBuy) {
            trades.push({
              tokenAddress: 'unknown', // Placeholder, needs actual parsing
              type: 'buy',
              amount: 0.01, // Placeholder
              timestamp: new Date(tx.blockTime * 1000)
            });
          }
        }
      }

      return trades;
    } catch (error) {
      logger.error(`Error fetching recent trades for ${publicKeyStr}: ${error.message}`);
      return [];
    }
  }

  // Add getSigner function to return the owner Keypair
  getSigner() {
    if (!this.owner) {
      throw new Error('Wallet not initialized');
    }
    return this.owner;
  }
}

const walletService = new WalletService();
export default walletService;