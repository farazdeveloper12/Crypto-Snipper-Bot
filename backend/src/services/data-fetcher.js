// backend/src/services/data-fetcher.js
import logger from '../utils/logger.js';
import tokenAnalyzer from './tokenAnalyzer.js';
import config from '../utils/config.js';
import apiService from './apiService.js';
import axios from 'axios';

class DataFetcher {
  constructor() {
    this.analyzedTokens = new Map();
    this.maxTokensToAnalyze = 10;
    this.lastChecked = {
      dexscreener: 0,
      birdeye: 0
    };
    this.minCheckInterval = 30 * 1000; // 30 seconds
    this.rateLimitDelay = 1000;
  }

  async fetchNewlyAddedTokens(chain) {
    try {
      logger.info(`🔍 Fetching NEWEST meme coins on ${chain}...`);

      let allTokens = [];

      if (chain === 'solana') {
        // Priority 1: Get newest tokens from DexScreener
        try {
          const dexTokens = await this.fetchNewestDexScreenerTokens();
          if (dexTokens.length > 0) {
            allTokens = allTokens.concat(dexTokens);
            logger.info(`✅ Found ${dexTokens.length} NEW tokens from DexScreener`);
          }
        } catch (error) {
          logger.error(`DexScreener error: ${error.message}`);
        }

        // Priority 2: Get from Birdeye if needed
        if (allTokens.length < 5) {
          try {
            const birdeyeTokens = await apiService.fetchNewlyLaunchedTokensFromBirdeye();
            if (birdeyeTokens.length > 0) {
              allTokens = allTokens.concat(birdeyeTokens);
              logger.info(`✅ Found ${birdeyeTokens.length} additional tokens from Birdeye`);
            }
          } catch (error) {
            logger.error(`Birdeye error: ${error.message}`);
          }
        }
      }

      if (allTokens.length === 0) {
        logger.warn('No new tokens found from any source');
        return [];
      }

      // Remove duplicates and filter
      const uniqueTokens = this.removeDuplicateTokens(allTokens);
      const filteredTokens = this.filterNewTokensOnly(uniqueTokens);
      
      logger.info(`🎯 Selected ${filteredTokens.length} NEW tokens for analysis`);
      
      return filteredTokens.slice(0, 10); // Return top 10 newest
    } catch (error) {
      logger.error(`Error fetching newly added tokens: ${error.message}`);
      return [];
    }
  }

  async fetchNewestDexScreenerTokens() {
    try {
      logger.info('Fetching NEWEST tokens from DexScreener...');
      
      // Try the new tokens endpoint first
      let response = await axios.get('https://api.dexscreener.com/latest/dex/tokens/new', {
        params: { chain: 'solana' },
        timeout: 10000
      });

      // If that fails, use search endpoint
      if (!response.data || response.data.length === 0) {
        response = await axios.get('https://api.dexscreener.com/latest/dex/search', {
          params: { q: 'new' },
          timeout: 10000
        });
      }

      let tokens = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          tokens = response.data;
        } else if (response.data.pairs) {
          tokens = response.data.pairs;
        }
      }

      // Filter and sort by creation time
      const newTokens = tokens
        .filter(token => {
          const issolana = (token.chainId === 'solana') || 
                          (token.baseToken && token.baseToken.address && token.dexId);
          
          if (!issolana) return false;
          
          // Check if token is new (created within last 24 hours)
          const createdAt = new Date(token.pairCreatedAt || token.createdAt || 0);
          const ageInHours = (Date.now() - createdAt) / (1000 * 60 * 60);
          
          return ageInHours < 24; // Only tokens less than 24 hours old
        })
        .sort((a, b) => {
          const dateA = new Date(a.pairCreatedAt || a.createdAt || 0);
          const dateB = new Date(b.pairCreatedAt || b.createdAt || 0);
          return dateB - dateA; // Newest first
        })
        .slice(0, 20) // Get top 20 newest
        .map(token => this.formatDexScreenerToken(token));

      logger.info(`Found ${newTokens.length} NEW tokens (< 24hrs old) from DexScreener`);
      return newTokens;
    } catch (error) {
      logger.error(`Error fetching from DexScreener: ${error.message}`);
      return [];
    }
  }

  formatDexScreenerToken(token) {
    // Handle both token formats from DexScreener
    if (token.baseToken) {
      // Pair format
      return {
        address: token.baseToken.address,
        name: token.baseToken.name || 'Unknown',
        symbol: token.baseToken.symbol || 'UNKNOWN',
        decimals: token.baseToken.decimals || 9,
        chain: 'solana',
        source: 'dexscreener',
        dex: token.dexId || 'unknown',
        price: parseFloat(token.priceUsd) || 0.00001,
        marketCap: token.marketCap || 0,
        volume24h: token.volume?.h24 || 0,
        liquidity: token.liquidity?.usd || 0,
        createdAt: token.pairCreatedAt || new Date().toISOString(),
        priceChange24h: token.priceChange?.h24 || 0,
        txns: {
          h24: {
            buys: token.txns?.h24?.buys || 0,
            sells: token.txns?.h24?.sells || 0
          }
        },
        isNew: true,
        ageInHours: (Date.now() - new Date(token.pairCreatedAt || 0)) / (1000 * 60 * 60)
      };
    } else {
      // Direct token format
      return {
        address: token.tokenAddress || token.address,
        name: token.name || 'Unknown',
        symbol: token.symbol || 'UNKNOWN',
        decimals: 9,
        chain: 'solana',
        source: 'dexscreener',
        dex: 'unknown',
        price: parseFloat(token.priceUsd) || 0.00001,
        marketCap: token.marketCap || 0,
        volume24h: token.volume24h || 0,
        liquidity: token.liquidity || 0,
        createdAt: token.createdAt || new Date().toISOString(),
        priceChange24h: token.priceChange24h || 0,
        isNew: true,
        ageInHours: (Date.now() - new Date(token.createdAt || 0)) / (1000 * 60 * 60)
      };
    }
  }

  filterNewTokensOnly(tokens) {
    try {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      logger.info(`Filtering ${tokens.length} tokens for NEW opportunities only`);

      const newTokens = tokens.filter(token => {
        if (!token || !token.address) return false;
        
        const createdAt = new Date(token.createdAt);
        const age = now - createdAt;
        
        // Must be less than 24 hours old
        if (age > maxAge) {
          logger.debug(`Token ${token.symbol} too old: ${(age / (1000 * 60 * 60)).toFixed(2)} hours`);
          return false;
        }
        
        // Basic validation
        if (token.liquidity < 500) {
          logger.debug(`Token ${token.symbol} liquidity too low: $${token.liquidity}`);
          return false;
        }
        
        return true;
      });

      logger.info(`✅ Filtered to ${newTokens.length} NEW tokens for analysis`);
      
      return newTokens.sort((a, b) => {
        // Sort by creation time (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } catch (error) {
      logger.error(`Error filtering new tokens: ${error.message}`);
      return tokens.slice(0, 10); // Return first 10 as fallback
    }
  }

  removeDuplicateTokens(tokens) {
    const uniqueTokens = [];
    const addressSet = new Set();

    for (const token of tokens) {
      if (token && token.address && !addressSet.has(token.address)) {
        addressSet.add(token.address);
        uniqueTokens.push(token);
      }
    }

    return uniqueTokens;
  }

  async enrichTokenData(tokens, chain) {
    try {
      logger.info(`Enriching data for ${tokens.length} tokens`);

      const enrichedTokens = [];

      for (const token of tokens) {
        try {
          if (!token.address) {
            logger.warn(`Skipping token with no address`);
            continue;
          }

          // Get additional data from DexScreener if needed
          let enrichedToken = { ...token };
          
          if (!token.marketCap || !token.liquidity) {
            try {
              const response = await axios.get(
                `https://api.dexscreener.com/latest/dex/tokens/${token.address}`,
                { timeout: 5000 }
              );
              
              if (response.data && response.data.pairs && response.data.pairs.length > 0) {
                const bestPair = response.data.pairs[0];
                enrichedToken = {
                  ...enrichedToken,
                  price: parseFloat(bestPair.priceUsd) || enrichedToken.price,
                  marketCap: bestPair.marketCap || enrichedToken.marketCap,
                  liquidity: bestPair.liquidity?.usd || enrichedToken.liquidity,
                  volume24h: bestPair.volume?.h24 || enrichedToken.volume24h,
                  txns: bestPair.txns || enrichedToken.txns
                };
              }
            } catch (error) {
              logger.debug(`Could not enrich ${token.symbol}: ${error.message}`);
            }
          }

          enrichedTokens.push(enrichedToken);
        } catch (tokenError) {
          logger.warn(`Error enriching token ${token?.symbol}: ${tokenError.message}`);
        }
      }

      logger.info(`Enriched ${enrichedTokens.length} tokens successfully`);
      return enrichedTokens;
    } catch (error) {
      logger.error(`Error enriching token data: ${error.message}`);
      return tokens;
    }
  }

  async findTradingOpportunities(tokens, settings, chain) {
    try {
      const opportunities = [];
      
      if (!tokens || tokens.length === 0) {
        logger.warn('No tokens provided for analysis');
        return opportunities;
      }

      logger.info(`🔍 Analyzing ${tokens.length} NEW tokens for opportunities`);

      for (const token of tokens) {
        try {
          if (!token || !token.address) {
            logger.warn(`Skipping token with no address`);
            continue;
          }

          logger.info(`📊 Analyzing ${token.symbol} (Age: ${token.ageInHours?.toFixed(1) || '?'} hours)`);

          // Mark as analyzed
          this.analyzedTokens.set(token.address, Date.now());

          // Perform comprehensive analysis
          const analysis = await tokenAnalyzer.analyzeToken(token.address, chain);

          if (!analysis) {
            logger.warn(`No analysis returned for token ${token.address}`);
            continue;
          }

          logger.info(`Analysis for ${token.symbol}: Score ${analysis.safetyScore}, Buy: ${analysis.buyRecommendation}`);

          // Check if token meets our criteria
          if (analysis.buyRecommendation && this.meetsNewTokenCriteria(analysis, settings, token)) {
            opportunities.push({
              token: {
                address: token.address,
                name: analysis.tokenInfo.name || token.name,
                symbol: analysis.tokenInfo.symbol || token.symbol,
                dex: token.dex || token.source
              },
              analysis: analysis,
              recommendedAction: 'buy',
              entryPrice: analysis.tokenInfo.price,
              stopLoss: analysis.tradingPotential.suggestedStopLoss,
              takeProfit: analysis.tradingPotential.suggestedTakeProfit,
              timestamp: new Date().toISOString()
            });

            logger.info(`🚀 OPPORTUNITY FOUND: ${token.symbol} - NEW token with high potential!`);
            break; // Only return one opportunity at a time
          } else {
            logger.info(`❌ ${token.symbol} doesn't meet criteria`);
          }
        } catch (error) {
          logger.error(`Error analyzing token ${token?.symbol}: ${error.message}`);
        }
      }

      logger.info(`Found ${opportunities.length} trading opportunities`);
      return opportunities;
    } catch (error) {
      logger.error(`Error finding trading opportunities: ${error.message}`);
      return [];
    }
  }

  meetsNewTokenCriteria(analysis, settings, token) {
    // Safety check
    if (!analysis.isSafe && settings.scamDetection) {
      logger.info(`Token ${token.symbol} failed safety check`);
      return false;
    }

    // Age check - must be new
    if (token.ageInHours > 24) {
      logger.info(`Token ${token.symbol} too old: ${token.ageInHours} hours`);
      return false;
    }

    // Market cap check - sweet spot for new tokens
    const marketCap = analysis.tokenInfo.marketCap;
    if (marketCap < 5000 || marketCap > 500000) {
      logger.info(`Token ${token.symbol} market cap ($${marketCap}) outside range ($5k-$500k)`);
      return false;
    }

    // Liquidity check
    const minLiquidity = Math.max(1000, settings.maxTradeAmount * 100);
    if (analysis.tokenInfo.liquidity < minLiquidity) {
      logger.info(`Token ${token.symbol} liquidity ($${analysis.tokenInfo.liquidity}) too low`);
      return false;
    }

    // Volume check
    if (token.volume24h < 500) {
      logger.info(`Token ${token.symbol} volume ($${token.volume24h}) too low`);
      return false;
    }

    // Buy/Sell ratio check
    if (token.txns && token.txns.h24) {
      const buyRatio = token.txns.h24.buys / (token.txns.h24.buys + token.txns.h24.sells);
      if (buyRatio < 0.4) {
        logger.info(`Token ${token.symbol} has too many sells (buy ratio: ${buyRatio})`);
        return false;
      }
    }

    logger.info(`✅ Token ${token.symbol} meets all criteria for NEW token trading!`);
    return true;
  }
}

const dataFetcher = new DataFetcher();
export default dataFetcher;