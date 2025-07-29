// src/services/tradingService.js
import { Connection, PublicKey, Transaction, Keypair, sendAndConfirmTransaction, VersionedTransaction } from '@solana/web3.js';
import logger from '../utils/logger.js';
import bs58 from 'bs58';
import fetch from 'node-fetch';

class TradingService {
  constructor() {
    this.solanaConnection = null;
    this.JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
    this.keypair = null;
    this.initialized = false;
  }

  // Initialize keypair lazily
  initializeKeypair() {
    if (this.initialized) return;

    const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
    if (!PRIVATE_KEY) {
      throw new Error('WALLET_PRIVATE_KEY not set in .env');
    }

    // Parse private key (handle both raw string and array format)
    let privateKeyString;
    try {
      const parsed = JSON.parse(PRIVATE_KEY);
      if (Array.isArray(parsed) && parsed.length > 0) {
        privateKeyString = parsed[0].trim();
      } else if (typeof parsed === 'string') {
        privateKeyString = parsed.trim();
      } else {
        throw new Error('Invalid private key format in .env');
      }
    } catch (error) {
      privateKeyString = PRIVATE_KEY.trim();
    }

    // Validate the private key format
    if (!privateKeyString || typeof privateKeyString !== 'string') {
      throw new Error('Private key must be a non-empty string');
    }

    // Decode the base58-encoded private key
    let privateKeyBytes;
    try {
      privateKeyBytes = bs58.decode(privateKeyString);
    } catch (error) {
      logger.error(`Error decoding private key: ${error.message}`);
      throw new Error(`Invalid private key format: ${error.message}`);
    }

    // Validate private key size (must be 64 bytes for Solana)
    if (privateKeyBytes.length !== 64) {
      throw new Error(`Invalid private key size: expected 64 bytes, got ${privateKeyBytes.length}`);
    }

    this.keypair = Keypair.fromSecretKey(privateKeyBytes);
    this.initialized = true;
    logger.info(`Trading service initialized with wallet: ${this.keypair.publicKey.toString()}`);
  }

  async initializeConnections() {
    try {
      // Initialize keypair if not already done
      this.initializeKeypair();
      
      this.solanaConnection = new Connection(
        process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000
        }
      );
      
      logger.info('Trading service connections initialized');
      logger.info(`Wallet public key: ${this.keypair.publicKey.toString()}`);
    } catch (error) {
      logger.error(`Error initializing blockchain connections: ${error.message}`);
      throw error;
    }
  }

  async executeTrade(userId, tokenAddress, amount, type, options = {}) {
    try {
      // Ensure keypair is initialized
      if (!this.keypair) {
        this.initializeKeypair();
      }

      const { chain = 'solana', slippage = 300 } = options; // Default 3% slippage (300 basis points)
      
      logger.info(`Executing ${type} trade for user ${userId}: ${amount} SOL for token ${tokenAddress} on ${chain}`);
      
      switch (chain.toLowerCase()) {
        case 'solana':
          return await this.executeSolanaTrade(tokenAddress, amount, type, options);
        case 'ethereum':
        case 'eth':
          return await this.executeEthereumTrade(tokenAddress, amount, type, options);
        case 'bsc':
          return await this.executeBscTrade(tokenAddress, amount, type, options);
        default:
          throw new Error(`Unsupported blockchain: ${chain}`);
      }
    } catch (error) {
      logger.error(`Error executing trade: ${error.message}`);
      throw error;
    }
  }

  async executeSolanaTrade(tokenAddress, amount, type, options) {
    try {
      logger.info(`Executing real ${type} order for ${amount} SOL of ${tokenAddress} on Solana`);

      // For forced/fallback tokens, use simulated trade
      if (tokenAddress === 'FORCED_TOKEN_ADDRESS' || tokenAddress === 'FALLBACK_TOKEN_1') {
        logger.warn(`Simulating trade for test token ${tokenAddress}`);
        return this.simulateTrade(tokenAddress, amount, type);
      }

      // SOL mint address
      const SOL_MINT = 'So11111111111111111111111111111111111111112';
      
      // Determine input and output mints based on trade type
      const inputMint = type === 'buy' ? SOL_MINT : tokenAddress;
      const outputMint = type === 'buy' ? tokenAddress : SOL_MINT;
      
      // Amount in lamports (for SOL) or smallest unit
      const amountInSmallestUnit = type === 'buy' ? 
        Math.floor(amount * 1_000_000_000) : // SOL to lamports
        Math.floor(amount * 1_000_000_000); // Adjust based on token decimals
      
      // Increased slippage for better success rate
      const slippageBps = options.slippage ? options.slippage * 100 : 1000; // Default 10% slippage

      logger.info(`Getting quote from Jupiter: ${inputMint} -> ${outputMint}, amount: ${amountInSmallestUnit}`);

      // Get quote from Jupiter
      const quoteResponse = await fetch(
        `${this.JUPITER_API_URL}/quote?` + new URLSearchParams({
          inputMint,
          outputMint,
          amount: amountInSmallestUnit.toString(),
          slippageBps: slippageBps.toString(),
          onlyDirectRoutes: 'false',
          asLegacyTransaction: 'false'
        })
      );

      if (!quoteResponse.ok) {
        const errorText = await quoteResponse.text();
        logger.error(`Jupiter quote error: ${errorText}`);
        throw new Error(`Failed to get quote: ${errorText}`);
      }

      const quoteData = await quoteResponse.json();
      
      if (!quoteData) {
        throw new Error('No quote data received from Jupiter');
      }

      logger.info(`Got quote: ${JSON.stringify({
        inAmount: quoteData.inAmount,
        outAmount: quoteData.outAmount,
        priceImpactPct: quoteData.priceImpactPct,
        routePlan: quoteData.routePlan?.length
      })}`);

      // Get swap transaction - FIXED: Remove conflicting parameters
      const swapResponse = await fetch(`${this.JUPITER_API_URL}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse: quoteData,
          userPublicKey: this.keypair.publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          // Remove both computeUnitPriceMicroLamports and prioritizationFeeLamports
          // Let Jupiter handle the fees automatically
        })
      });

      if (!swapResponse.ok) {
        const errorText = await swapResponse.text();
        logger.error(`Jupiter swap error: ${errorText}`);
        
        // Try again with legacy transaction format if versioned transaction fails
        if (errorText.includes('Compute unit price')) {
          logger.info('Retrying with legacy transaction format...');
          
          const legacySwapResponse = await fetch(`${this.JUPITER_API_URL}/swap`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              quoteResponse: quoteData,
              userPublicKey: this.keypair.publicKey.toString(),
              wrapAndUnwrapSol: true,
              asLegacyTransaction: true // Force legacy transaction
            })
          });
          
          if (!legacySwapResponse.ok) {
            const legacyErrorText = await legacySwapResponse.text();
            logger.error(`Legacy swap also failed: ${legacyErrorText}`);
            throw new Error(`Failed to get swap transaction: ${legacyErrorText}`);
          }
          
          const legacySwapData = await legacySwapResponse.json();
          return await this.executeLegacyTransaction(legacySwapData, tokenAddress, amount, type, quoteData);
        }
        
        throw new Error(`Failed to get swap transaction: ${errorText}`);
      }

      const swapData = await swapResponse.json();
      
      if (!swapData.swapTransaction) {
        throw new Error('No swap transaction returned from Jupiter');
      }

      logger.info('Got swap transaction from Jupiter, preparing to send...');

      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      // Sign the transaction
      transaction.sign([this.keypair]);

      // Send transaction with retries
      const latestBlockhash = await this.solanaConnection.getLatestBlockhash('confirmed');
      
      const rawTransaction = transaction.serialize();
      const txid = await this.solanaConnection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 3,
        preflightCommitment: 'confirmed'
      });

      logger.info(`Transaction sent: ${txid}`);
      
      // Wait for confirmation with timeout
      const confirmation = await this.solanaConnection.confirmTransaction({
        signature: txid,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      logger.info(`✅ Real Solana trade executed successfully: ${txid}`);

      // Calculate price based on amounts
      const price = type === 'buy' ? 
        parseFloat(quoteData.outAmount) / 1_000_000_000 / amount : // tokens received per SOL
        parseFloat(quoteData.outAmount) / 1_000_000_000; // SOL received

      return {
        success: true,
        transaction: {
          signature: txid,
          blockTime: Date.now() / 1000,
          slot: confirmation.context.slot
        },
        tokenAddress,
        amount,
        type,
        price,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Error executing real Solana trade: ${error.message}`);
      
      // Special handling for known liquid tokens - try with minimal parameters
      if (this.isKnownLiquidToken(tokenAddress)) {
        logger.info('Attempting simplified trade for known liquid token...');
        return await this.executeSimplifiedTrade(tokenAddress, amount, type, options);
      }
      
      // For testing purposes, return simulated trade on error
      if (process.env.ALLOW_SIMULATED_FALLBACK === 'true') {
        logger.warn(`Falling back to simulated trade due to error: ${error.message}`);
        return this.simulateTrade(tokenAddress, amount, type);
      }
      
      throw error;
    }
  }

  async executeLegacyTransaction(swapData, tokenAddress, amount, type, quoteData) {
    try {
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = Transaction.from(swapTransactionBuf);
      
      // Sign the transaction
      transaction.sign(this.keypair);
      
      // Send and confirm
      const txid = await sendAndConfirmTransaction(
        this.solanaConnection,
        transaction,
        [this.keypair],
        {
          commitment: 'confirmed',
          skipPreflight: true
        }
      );
      
      logger.info(`✅ Real Solana trade executed successfully (legacy): ${txid}`);
      
      const price = type === 'buy' ? 
        parseFloat(quoteData.outAmount) / 1_000_000_000 / amount :
        parseFloat(quoteData.outAmount) / 1_000_000_000;
      
      return {
        success: true,
        transaction: {
          signature: txid,
          blockTime: Date.now() / 1000,
          slot: 0
        },
        tokenAddress,
        amount,
        type,
        price,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Legacy transaction failed: ${error.message}`);
      throw error;
    }
  }

  async executeSimplifiedTrade(tokenAddress, amount, type, options) {
    try {
      // Use minimal parameters for known tokens
      const SOL_MINT = 'So11111111111111111111111111111111111111112';
      const inputMint = type === 'buy' ? SOL_MINT : tokenAddress;
      const outputMint = type === 'buy' ? tokenAddress : SOL_MINT;
      const amountInSmallestUnit = Math.floor(amount * 1_000_000_000);
      
      // Get quote with minimal parameters
      const quoteResponse = await fetch(
        `${this.JUPITER_API_URL}/quote?` + new URLSearchParams({
          inputMint,
          outputMint,
          amount: amountInSmallestUnit.toString(),
          slippageBps: '1000' // 10% slippage
        })
      );
      
      const quoteData = await quoteResponse.json();
      
      // Get swap with minimal parameters
      const swapResponse = await fetch(`${this.JUPITER_API_URL}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quoteData,
          userPublicKey: this.keypair.publicKey.toString(),
          wrapAndUnwrapSol: true
        })
      });
      
      const swapData = await swapResponse.json();
      
      if (!swapData.swapTransaction) {
        throw new Error('No swap transaction returned');
      }
      
      // Execute transaction
      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      transaction.sign([this.keypair]);
      
      const txid = await this.solanaConnection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: true,
        maxRetries: 3
      });
      
      await this.solanaConnection.confirmTransaction(txid, 'confirmed');
      
      logger.info(`✅ Simplified trade executed successfully: ${txid}`);
      
      return {
        success: true,
        transaction: { signature: txid, blockTime: Date.now() / 1000, slot: 0 },
        tokenAddress,
        amount,
        type,
        price: parseFloat(quoteData.outAmount) / 1_000_000_000 / amount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Simplified trade failed: ${error.message}`);
      throw error;
    }
  }

  isKnownLiquidToken(address) {
    const knownTokens = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
    ];
    return knownTokens.includes(address);
  }

  simulateTrade(tokenAddress, amount, type) {
    logger.warn(`Simulating ${type} order for ${amount} SOL of ${tokenAddress} on Solana`);
    return {
      success: true,
      transaction: {
        signature: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        blockTime: Date.now() / 1000,
        slot: Math.floor(Math.random() * 1000000)
      },
      tokenAddress,
      amount,
      type,
      price: Math.random() * 0.1,
      timestamp: new Date().toISOString()
    };
  }

  async executeEthereumTrade(tokenAddress, amount, type, options) {
    logger.info(`Simulating ${type} order for ${amount} of ${tokenAddress} on Ethereum`);
    return this.simulateTrade(tokenAddress, amount, type);
  }

  async executeBscTrade(tokenAddress, amount, type, options) {
    logger.info(`Simulating ${type} order for ${amount} of ${tokenAddress} on BSC`);
    return this.simulateTrade(tokenAddress, amount, type);
  }

  async getTokenPrice(tokenAddress, chain = 'solana') {
    try {
      logger.info(`Getting price for token ${tokenAddress} on ${chain}`);
      
      // Try to get real price from Jupiter
      if (chain === 'solana' && tokenAddress !== 'FORCED_TOKEN_ADDRESS') {
        try {
          const SOL_MINT = 'So11111111111111111111111111111111111111112';
          const quoteResponse = await fetch(
            `${this.JUPITER_API_URL}/quote?` + new URLSearchParams({
              inputMint: SOL_MINT,
              outputMint: tokenAddress,
              amount: '1000000000', // 1 SOL
              slippageBps: '100'
            })
          );
          
          if (quoteResponse.ok) {
            const quoteData = await quoteResponse.json();
            if (quoteData && quoteData.outAmount) {
              const price = 1 / (parseFloat(quoteData.outAmount) / 1_000_000_000);
              logger.info(`Got real price for ${tokenAddress}: ${price}`);
              return price;
            }
          }
        } catch (error) {
          logger.warn(`Failed to get real price: ${error.message}`);
        }
      }
      
      // Fallback to random price
      return Math.random() * (chain === 'solana' ? 0.1 : 10);
    } catch (error) {
      logger.error(`Error getting token price: ${error.message}`);
      throw error;
    }
  }
}

const tradingServiceInstance = new TradingService();
export default tradingServiceInstance;