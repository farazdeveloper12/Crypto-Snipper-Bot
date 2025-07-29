// src/services/quicknode-scanner.js
import { Connection, PublicKey } from '@solana/web3.js';
import logger from '../utils/logger.js';
import axios from 'axios';

class QuickNodeScanner {
  constructor() {
    this.connection = null;
    this.processedTokens = new Set();
    this.isMonitoring = false;
    this.quickNodeUrl = process.env.SOLANA_RPC_URL || 'https://clean-sleek-sea.solana-mainnet.quiknode.pro/8b2d195b879ceb49d31244c7a836795c19119d95/';
  }

  async initialize() {
    try {
      this.connection = new Connection(this.quickNodeUrl, {
        commitment: 'confirmed',
        wsEndpoint: this.quickNodeUrl.replace('https://', 'wss://')
      });
      logger.info('QuickNode scanner initialized');
    } catch (error) {
      logger.error(`Failed to initialize QuickNode scanner: ${error.message}`);
    }
  }

  async startMonitoring(callback) {
    if (this.isMonitoring) {
      logger.info('QuickNode monitoring already active');
      return;
    }

    this.isMonitoring = true;
    logger.info('🚀 Starting QuickNode real-time token monitoring...');

    // Monitor Raydium pool creation
    await this.monitorRaydiumPools(callback);
    
    // Also poll DexScreener more aggressively
    setInterval(() => this.pollLatestTokens(callback), 15000); // Every 15 seconds
  }

  async monitorRaydiumPools(callback) {
    try {
      // Raydium AMM V4 Program ID
      const RAYDIUM_AMM_PROGRAM = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
      
      // Subscribe to Raydium program logs
      this.connection.onLogs(
        RAYDIUM_AMM_PROGRAM,
        async (logs) => {
          try {
            // Check if this is a pool initialization
            if (logs.logs.some(log => log.includes('InitializeInstruction2'))) {
              logger.info('🆕 New Raydium pool detected!');
              
              // Extract token mint from logs
              const tokenInfo = await this.extractTokenFromLogs(logs);
              if (tokenInfo && !this.processedTokens.has(tokenInfo.mint)) {
                this.processedTokens.add(tokenInfo.mint);
                
                // Get token details from DexScreener
                const tokenDetails = await this.getTokenDetails(tokenInfo.mint);
                if (tokenDetails) {
                  logger.info(`✅ New token found: ${tokenDetails.symbol} (${tokenDetails.name})`);
                  await callback(tokenDetails);
                }
              }
            }
          } catch (error) {
            logger.error(`Error processing Raydium logs: ${error.message}`);
          }
        },
        'confirmed'
      );
      
      logger.info('✅ Monitoring Raydium pool creation events');
    } catch (error) {
      logger.error(`Failed to monitor Raydium pools: ${error.message}`);
    }
  }

  async extractTokenFromLogs(logs) {
    try {
      // Parse transaction to find token mints
      const signature = logs.signature;
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });
      
      if (!tx || !tx.transaction) return null;
      
      // Look for token mints in the transaction
      const instructions = tx.transaction.message.instructions;
      for (const ix of instructions) {
        if (ix.parsed && ix.parsed.info && ix.parsed.info.mint) {
          return { mint: ix.parsed.info.mint };
        }
      }
      
      return null;
    } catch (error) {
      logger.error(`Error extracting token from logs: ${error.message}`);
      return null;
    }
  }

  async pollLatestTokens(callback) {
    try {
      logger.info('🔍 Polling for latest tokens...');
      
      // Method 1: DexScreener with better parameters
      const tokens = await this.fetchLatestDexScreenerTokens();
      
      for (const token of tokens) {
        if (!this.processedTokens.has(token.address)) {
          this.processedTokens.add(token.address);
          logger.info(`✅ New token via polling: ${token.symbol}`);
          await callback(token);
        }
      }
      
      // Method 2: Check latest Solana blocks for new tokens
      await this.scanLatestBlocks(callback);
      
    } catch (error) {
      logger.error(`Error polling latest tokens: ${error.message}`);
    }
  }

  async fetchLatestDexScreenerTokens() {
    try {
      // Try multiple DexScreener endpoints
      const endpoints = [
        'https://api.dexscreener.com/latest/dex/search?q=new%20solana',
        'https://api.dexscreener.com/latest/dex/search?q=pump',
        'https://api.dexscreener.com/latest/dex/tokens/solana'
      ];
      
      let allTokens = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: 5000 });
          
          if (response.data && response.data.pairs) {
            const newTokens = response.data.pairs
              .filter(pair => {
                if (pair.chainId !== 'solana') return false;
                
                const createdAt = new Date(pair.pairCreatedAt);
                const ageInMinutes = (Date.now() - createdAt) / (1000 * 60);
                
                // Only tokens created in last 60 minutes
                return ageInMinutes < 60;
              })
              .map(pair => ({
                address: pair.baseToken.address,
                name: pair.baseToken.name,
                symbol: pair.baseToken.symbol,
                priceUsd: parseFloat(pair.priceUsd) || 0,
                marketCap: pair.marketCap || 0,
                liquidity: { usd: pair.liquidity?.usd || 0 },
                volume: { h24: pair.volume?.h24 || 0 },
                priceChange: { h24: pair.priceChange?.h24 || 0 },
                pairCreatedAt: pair.pairCreatedAt,
                txns: {
                  h24: {
                    buys: pair.txns?.h24?.buys || 0,
                    sells: pair.txns?.h24?.sells || 0
                  }
                },
                dexId: pair.dexId,
                ageInMinutes: (Date.now() - new Date(pair.pairCreatedAt)) / (1000 * 60)
              }));
            
            allTokens = allTokens.concat(newTokens);
          }
        } catch (error) {
          logger.debug(`Failed to fetch from ${endpoint}: ${error.message}`);
        }
      }
      
      // Remove duplicates and sort by age
      const uniqueTokens = Array.from(
        new Map(allTokens.map(t => [t.address, t])).values()
      ).sort((a, b) => a.ageInMinutes - b.ageInMinutes);
      
      logger.info(`Found ${uniqueTokens.length} tokens created in last hour`);
      return uniqueTokens.slice(0, 10); // Return newest 10
      
    } catch (error) {
      logger.error(`Error fetching DexScreener tokens: ${error.message}`);
      return [];
    }
  }

  async scanLatestBlocks(callback) {
    try {
      const slot = await this.connection.getSlot();
      const block = await this.connection.getBlock(slot, {
        maxSupportedTransactionVersion: 0
      });
      
      if (!block) return;
      
      // Look for token creation transactions
      for (const tx of block.transactions) {
        try {
          const meta = tx.meta;
          if (!meta || meta.err) continue;
          
          // Check for token program interactions
          const hasTokenProgram = meta.postTokenBalances?.length > meta.preTokenBalances?.length;
          
          if (hasTokenProgram) {
            // This might be a new token creation
            logger.debug('Potential new token found in block');
          }
        } catch (error) {
          // Skip failed transactions
        }
      }
    } catch (error) {
      logger.debug(`Error scanning blocks: ${error.message}`);
    }
  }

  async getTokenDetails(mintAddress) {
    try {
      // Try to get details from DexScreener
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`,
        { timeout: 5000 }
      );
      
      if (response.data && response.data.pairs && response.data.pairs.length > 0) {
        const pair = response.data.pairs[0];
        return {
          address: mintAddress,
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          priceUsd: parseFloat(pair.priceUsd) || 0,
          marketCap: pair.marketCap || 0,
          liquidity: { usd: pair.liquidity?.usd || 0 },
          volume: { h24: pair.volume?.h24 || 0 },
          pairCreatedAt: pair.pairCreatedAt || new Date().toISOString(),
          dexId: pair.dexId
        };
      }
      
      return null;
    } catch (error) {
      logger.error(`Error getting token details: ${error.message}`);
      return null;
    }
  }

  stopMonitoring() {
    this.isMonitoring = false;
    logger.info('QuickNode monitoring stopped');
  }
}

const quickNodeScanner = new QuickNodeScanner();
export default quickNodeScanner;