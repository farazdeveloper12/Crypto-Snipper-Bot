// src/utils/scam-detector.js
import axios from 'axios';
import logger from './logger.js';

class ScamDetector {
  constructor() {
    this.apiKey = process.env.SCAM_DETECTION_API_KEY || '';
    this.baseUrl = 'https://api.dexscreener.com/latest/dex/tokens/';
  }

  /**
   * Analyze token contract and liquidity to detect potential scams
   * @param {string} tokenAddress - Token contract address
   * @param {string} chain - Blockchain (ethereum, bsc, solana)
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeToken(tokenAddress, chain = 'solana') {
    try {
      logger.info(`Analyzing token for scam risk: ${tokenAddress} on ${chain}`);
      
      // Fetch token data from DexScreener
      const response = await axios.get(`${this.baseUrl}${tokenAddress}`);
      const pairs = response.data.pairs || [];
      
      if (pairs.length === 0) {
        logger.warn(`No liquidity pairs found for token: ${tokenAddress}`);
        return {
          isScam: true,
          riskLevel: 'high',
          reasons: ['No liquidity pairs found']
        };
      }

      // Get the main trading pair
      const mainPair = pairs[0];

      // Check for red flags
      const redFlags = [];

      // 1. Check liquidity
      const liquidityUsd = mainPair.liquidity?.usd || 0;
      if (liquidityUsd < 5000) {
        redFlags.push('Very low liquidity');
      }

      // 2. Check token age
      const creationTime = new Date(mainPair.createTime).getTime();
      const nowTime = Date.now();
      const tokenAgeHours = (nowTime - creationTime) / (1000 * 60 * 60);
      
      if (tokenAgeHours < 24) {
        redFlags.push('Token less than 24 hours old');
      }

      // 3. Check for suspicious token name/symbol
      const tokenName = mainPair.baseToken.name.toLowerCase();
      const tokenSymbol = mainPair.baseToken.symbol.toLowerCase();
      
      const suspiciousKeywords = ['elon', 'musk', 'moon', 'safe', 'gem', 'doge', 'shib', 'inu', 'swap', 'pepe'];
      const containsSuspiciousWord = suspiciousKeywords.some(keyword => 
        tokenName.includes(keyword) || tokenSymbol.includes(keyword)
      );
      
      if (containsSuspiciousWord) {
        redFlags.push('Suspicious token name/symbol');
      }

      // 4. Calculate risk level
      let riskLevel = 'low';
      if (redFlags.length > 2) {
        riskLevel = 'high';
      } else if (redFlags.length > 0) {
        riskLevel = 'medium';
      }

      return {
        isScam: riskLevel === 'high',
        riskLevel,
        reasons: redFlags,
        tokenData: {
          name: mainPair.baseToken.name,
          symbol: mainPair.baseToken.symbol,
          liquidity: liquidityUsd,
          age: tokenAgeHours
        }
      };
    } catch (error) {
      logger.error(`Error analyzing token for scams: ${error.message}`);
      
      // Default to high risk when analysis fails
      return {
        isScam: true,
        riskLevel: 'high',
        reasons: ['Analysis failed', error.message]
      };
    }
  }

  /**
   * Check if token is on scam blacklist
   * @param {string} tokenAddress - Token contract address
   * @returns {Promise<boolean>} Whether token is blacklisted
   */
  async isBlacklisted(tokenAddress) {
    try {
      // This would use a real API or database in production
      const blacklistedTokens = [
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321'
      ];
      
      return blacklistedTokens.includes(tokenAddress.toLowerCase());
    } catch (error) {
      logger.error(`Error checking token blacklist: ${error.message}`);
      return false;
    }
  }
}

const scamDetector = new ScamDetector();
export default scamDetector;