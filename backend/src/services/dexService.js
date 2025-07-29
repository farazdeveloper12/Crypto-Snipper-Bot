// src/services/dexService.js
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import logger from '../utils/logger.js';
import walletService from './walletService.js';
import apiService from './apiService.js';
import { Liquidity, MAINNET_PROGRAM_ID, SPL_ACCOUNT_LAYOUT, TokenAmount, Token, Percent } from '@raydium-io/raydium-sdk';

class DexService {
  constructor() {
    this.connection = null;
    this.rpcUrl = process.env.SOLANA_RPC_URL || 'https://clean-sleek-sea.solana-mainnet.quiknode.pro/8b2d195b879ceb49d31244c7a836795c19119d95/';
  }

  async initialize() {
    try {
      this.connection = new Connection(this.rpcUrl, 'confirmed');
      logger.info('DEX service initialized with QuickNode RPC');
    } catch (error) {
      logger.error(`Failed to initialize DEX service: ${error.message}`);
      throw error;
    }
  }

  async swapTokens(walletAddress, fromToken, toToken, amount, minAmountOut, slippage, chain) {
    try {
      logger.info(`Initiating swap: ${amount} ${fromToken} to ${toToken} for wallet ${walletAddress}`);

      // Validate inputs
      if (!walletAddress || !fromToken || !toToken || !amount || !minAmountOut) {
        throw new Error('Invalid swap parameters');
      }

      logger.info('Fetching wallet signer...');
      const wallet = walletService.getSigner();
      if (!wallet) {
        throw new Error('Wallet not initialized in walletService');
      }

      logger.info('Wallet public key:', wallet.publicKey.toBase58());

      const walletPubkey = new PublicKey(walletAddress);
      if (!walletPubkey.equals(wallet.publicKey)) {
        throw new Error('Wallet address does not match initialized wallet');
      }

      // Prepare swap using Raydium SDK
      const fromTokenMint = fromToken === 'SOL' ? 'So11111111111111111111111111111111111111112' : fromToken;
      const toTokenMint = toToken;

      const amountIn = fromToken === 'SOL' 
        ? Math.floor(amount * LAMPORTS_PER_SOL)
        : Math.floor(amount * Math.pow(10, 9)); // Assuming 9 decimals for token
      const minimumAmountOut = Math.floor(minAmountOut * Math.pow(10, 9) * (1 - slippage));

      logger.info(`Swap details: Amount In: ${amountIn}, Minimum Amount Out: ${minimumAmountOut}`);

      // Fetch pool info for the token pair
      const poolInfo = await Liquidity.fetchPoolKeys({
        connection: this.connection,
        baseMint: new PublicKey(fromTokenMint),
        quoteMint: new PublicKey(toTokenMint),
        programId: MAINNET_PROGRAM_ID.AmmV4,
      });

      if (!poolInfo || poolInfo.length === 0) {
        throw new Error(`No liquidity pool found for ${fromToken} to ${toToken}`);
      }

      // Define tokens
      const fromTokenObject = new Token(TOKEN_PROGRAM_ID, new PublicKey(fromTokenMint), 9);
      const toTokenObject = new Token(TOKEN_PROGRAM_ID, new PublicKey(toTokenMint), 9);

      // Create TokenAmount for input
      const amountInToken = new TokenAmount(fromTokenObject, amountIn, false);

      // Fetch token accounts
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(wallet.publicKey, { programId: TOKEN_PROGRAM_ID });
      const userTokenAccounts = tokenAccounts.value.map((item) => ({
        pubkey: item.pubkey,
        accountInfo: SPL_ACCOUNT_LAYOUT.decode(item.account.data),
      }));

      // Prepare swap transaction
      const swapTx = await Liquidity.makeSwapInstructionSimple({
        connection: this.connection,
        poolKeys: poolInfo[0],
        userKeys: {
          owner: wallet.publicKey,
          payer: wallet.publicKey,
          tokenAccounts: userTokenAccounts,
        },
        amountIn: amountInToken,
        amountOutMin: minimumAmountOut,
        fixedSide: 'in',
        slippage: new Percent(Math.floor(slippage * 100), 100), // Slippage as percentage
        config: {
          bypassAssociatedCheck: false,
        },
      });

      const transaction = new Transaction().add(...swapTx.innerTransactions[0].instructions);

      // Sign and send transaction
      logger.info('Sending transaction...');
      const signature = await this.connection.sendTransaction(transaction, [wallet], {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      await this.connection.confirmTransaction(signature);

      logger.info(`Swap transaction successful: ${signature}`);
      return {
        success: true,
        transactionId: signature
      };
    } catch (error) {
      logger.error(`Error swapping tokens: ${error.message}`);
      logger.error(error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getTokenPrice(tokenAddress) {
    try {
      const price = await apiService.getTokenPrice(tokenAddress);
      return price;
    } catch (error) {
      logger.error(`Error getting token price: ${error.message}`);
      throw error;
    }
  }
}

const dexService = new DexService();
export default dexService;