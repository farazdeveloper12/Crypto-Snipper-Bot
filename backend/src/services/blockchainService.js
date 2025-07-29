// src/services/blockchainService.js
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import axios from 'axios';
import { logger } from '../utils/logger.js';

// Initialize Solana connection
const getSolanaConnection = () => {
  return new Connection(process.env.SOLANA_RPC_URL);
};

// Get Solana wallet balance
export const getSolanaBalance = async (address) => {
  try {
    const connection = getSolanaConnection();
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    
    // Convert lamports to SOL
    return balance / 1_000_000_000;
  } catch (error) {
    logger.error(`Error getting Solana balance: ${error.message}`);
    throw new Error(`Failed to get wallet balance: ${error.message}`);
  }
};

// Get token price from CoinGecko
export const getTokenPrice = async (tokenId, currency = 'usd') => {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=${currency}`
    );
    
    if (response.data && response.data[tokenId]) {
      return response.data[tokenId][currency];
    }
    
    return null;
  } catch (error) {
    logger.error(`Error getting token price: ${error.message}`);
    return null;
  }
};

// Get new token launches from DexScreener
export const getNewTokenLaunches = async (chain = 'solana', limit = 10) => {
  try {
    // Format chain for DexScreener API
    const chainMap = {
      solana: 'solana',
      ethereum: 'ethereum',
      bsc: 'bsc'
    };
    
    const formattedChain = chainMap[chain.toLowerCase()] || 'solana';
    
    // Call DexScreener API
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${formattedChain}/recent?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEX_SCREENER_API_KEY}`
        }
      }
    );
    
    if (!response.data || !response.data.pairs) {
      return [];
    }
    
    // Format the response
    return response.data.pairs.map(pair => {
      const token = {
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        address: pair.baseToken.address,
        chain: formattedChain,
        decimals: parseInt(pair.baseToken.decimals) || 18,
        price: parseFloat(pair.priceUsd) || 0,
        priceChange24h: parseFloat(pair.priceChange.h24) || 0,
        liquidity: parseFloat(pair.liquidity.usd) || 0,
        volume24h: parseFloat(pair.volume.h24) || 0,
        dex: pair.dexId,
        launchDate: new Date(pair.createTime)
      };
      
      return token;
    });
  } catch (error) {
    logger.error(`Error getting new token launches: ${error.message}`);
    return [];
  }
};

// Check if a token contract has potential scam indicators
export const analyzeTokenSecurity = async (tokenAddress, chain = 'solana') => {
  try {
    // Call a security API or perform analysis
    // This is a simplified mock implementation
    const scamProbability = Math.random();
    const securityScore = Math.floor((1 - scamProbability) * 100);
    
    const scamIndicators = [];
    
    if (scamProbability > 0.7) {
      scamIndicators.push('No locked liquidity');
      scamIndicators.push('Contract has mint function');
    } else if (scamProbability > 0.5) {
      scamIndicators.push('Ownership not renounced');
    } else if (scamProbability > 0.3) {
      scamIndicators.push('Low liquidity');
    }
    
    return {
      isScam: scamProbability > 0.7,
      securityScore,
      scamProbability,
      scamIndicators
    };
  } catch (error) {
    logger.error(`Error analyzing token security: ${error.message}`);
    return {
      isScam: false,
      securityScore: 50,
      scamProbability: 0.5,
      scamIndicators: ['Unable to analyze security']
    };
  }
};

export default {
  getSolanaBalance,
  getTokenPrice,
  getNewTokenLaunches,
  analyzeTokenSecurity
};