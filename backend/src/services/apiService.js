// src/services/apiService.js
import logger from '../utils/logger.js';
import axios from 'axios';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';

let newlyLaunchedTokens = [];
let creditUsageCount = 0;
const MAX_TOKENS_PER_INTERVAL = 20;
const CREDIT_USAGE_THRESHOLD = 50000;
const BATCH_SIZE = 5;
const BATCH_PAUSE_DURATION = 30000;
const THROTTLE_DELAY = 180000;

class ApiService {
  constructor() {
    this.connection = null;
    this.metaplex = null;
    this.subscriptionId = null;
    this.isSubscriptionActive = false;
    this.BIRDEYE_API_KEY = 'ebb25f46f1084781a288baec027c050a';
    this.BIRDEYE_API_URL = 'https://public-api.birdeye.so';
    this.DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex/tokens';
    this.useQuickNode = false;
    this.tempTokenBatch = [];
    this.lastBirdeyeFetch = 0;
    this.BIRDEYE_FETCH_COOLDOWN = 5 * 60 * 1000;
  }

  async initialize() {
    try {
      const quickNodeRpcUrl = 'https://clean-sleek-sea.solana-mainnet.quiknode.pro/8b2d195b879ceb49d31244c7a836795c19119d95';
      const quickNodeWsUrl = 'wss://clean-sleek-sea.solana-mainnet.quiknode.pro/8b2d195b879ceb49d31244c7a836795c19119d95';

      this.connection = new Connection(quickNodeRpcUrl, {
        wsEndpoint: quickNodeWsUrl,
        commitment: 'confirmed'
      });

      const version = await this.connection.getVersion();
      logger.info(`Connected to Solana mainnet. Version: ${JSON.stringify(version)}`);

      const keypair = Keypair.generate();
      this.metaplex = Metaplex.make(this.connection)
        .use(keypairIdentity(keypair));

      logger.info('ApiService initialized successfully with QuickNode');
    } catch (error) {
      logger.error(`Error initializing ApiService: ${error.message}`);
      throw error;
    }
  }

  async fetchDexScreenerTokens() {
    try {
      logger.info('Fetching tokens from DexScreener API...');
      const response = await axios.get('https://api.dexscreener.com/latest/dex/search', {
        params: {
          q: 'solana', // Search for Solana-based tokens
          chain: 'solana'
        },
        timeout: 15000
      });

      if (response.status !== 200 || !response.data.pairs || response.data.pairs.length === 0) {
        logger.warn(`DexScreener API failed: ${response.statusText}`);
        logger.warn(`Response Data: ${JSON.stringify(response.data, null, 2)}`);
        return this.getFallbackTokens();
      }

      const tokens = response.data.pairs
        .filter(pair => pair.chainId === 'solana') // Ensure only Solana tokens
        .map(pair => ({
          baseToken: {
            address: pair.baseToken.address,
            name: pair.baseToken.name,
            symbol: pair.baseToken.symbol,
            decimals: pair.baseToken.decimals || 9
          },
          dexId: pair.dexId,
          priceUsd: pair.priceUsd,
          marketCap: pair.marketCap,
          liquidity: { usd: pair.liquidity?.usd || 0 },
          volume: { h24: pair.volume?.h24 || 0 },
          priceChange: { h24: pair.priceChange?.h24 || 0 },
          pairCreatedAt: pair.pairCreatedAt || new Date().toISOString()
        }));

      logger.info(`Fetched ${tokens.length} tokens from DexScreener`);
      return tokens.length > 0 ? tokens : this.getFallbackTokens();
    } catch (error) {
      logger.error(`Error fetching tokens from DexScreener API: ${error.message}`);
      if (error.response) {
        logger.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return this.getFallbackTokens();
    }
  }

  async startTokenSubscription() {
    if (!this.useQuickNode || this.isSubscriptionActive) {
      logger.info('QuickNode subscription is disabled or already active, skipping');
      return;
    }

    logger.info('Starting WebSocket subscription for token mint events...');
    try {
      const tokenProgramId = TOKEN_PROGRAM_ID;

      this.subscriptionId = this.connection.onProgramAccountChange(
        tokenProgramId,
        async (keyedAccountInfo, context) => {
          try {
            creditUsageCount += 1;

            if (creditUsageCount % 10000 === 0) {
              logger.info(`Credit usage count: ${creditUsageCount}`);
            }

            if (creditUsageCount > CREDIT_USAGE_THRESHOLD) {
              logger.warn('Credit usage threshold exceeded, stopping QuickNode subscription');
              this.useQuickNode = false;
              await this.stopTokenSubscription();
              return;
            }

            await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY));

            const mintAddress = keyedAccountInfo.accountId;

            let name = `Token_${mintAddress.toBase58().slice(0, 8)}`;
            let symbol = `TKN_${mintAddress.toBase58().slice(0, 4)}`;
            try {
              const metadata = await this.metaplex.nfts().findByMint({ mintAddress });
              if (metadata && metadata.name && metadata.symbol) {
                name = metadata.name.trim().replace(/\0/g, '');
                symbol = metadata.symbol.trim().replace(/\0/g, '');
              }
            } catch (error) {
              logger.warn(`Error fetching metadata for token ${mintAddress.toBase58()}: ${error.message}`);
            }

            const tokenData = {
              address: mintAddress.toBase58(),
              name: name,
              symbol: symbol,
              createdAt: new Date().toISOString(),
              solscanLink: `https://solscan.io/token/${mintAddress.toBase58()}`
            };

            this.tempTokenBatch.push(tokenData);

            if (this.tempTokenBatch.length >= BATCH_SIZE) {
              logger.info(`Processed ${this.tempTokenBatch.length} new token mint events`);
              this.tempTokenBatch = [];
            }

            newlyLaunchedTokens.push(tokenData);
            logger.info(`Added token to newlyLaunchedTokens: ${tokenData.address}, Total tokens: ${newlyLaunchedTokens.length}`);

            if (newlyLaunchedTokens.length > MAX_TOKENS_PER_INTERVAL) {
              newlyLaunchedTokens = newlyLaunchedTokens.slice(-MAX_TOKENS_PER_INTERVAL);
              logger.info(`Trimmed newlyLaunchedTokens to ${MAX_TOKENS_PER_INTERVAL} to prevent memory issues`);
            }
          } catch (error) {
            logger.error(`Error processing token mint event: ${error.message}`, { error });
          }
        },
        'confirmed',
        [
          {
            dataSize: 165
          }
        ]
      );

      this.isSubscriptionActive = true;
      logger.info(`Subscribed to token mint events with subscription ID: ${this.subscriptionId}`);
    } catch (error) {
      logger.error(`Error setting up WebSocket subscription: ${error.message}`);
      this.isSubscriptionActive = false;
      setTimeout(() => this.startTokenSubscription(), 5000);
    }
  }

  async fetchNewlyLaunchedTokensFromBirdeye() {
    const maxRetries = 3;
    let retries = 0;

    const now = Date.now();
    if (now - this.lastBirdeyeFetch < this.BIRDEYE_FETCH_COOLDOWN) {
      logger.info('Birdeye API fetch on cooldown, returning fallback tokens');
      return this.getFallbackTokens();
    }

    while (retries < maxRetries) {
      try {
        logger.info('Fetching newly launched tokens from Birdeye API using /defi/v2/tokens/new_listing endpoint...');
        const response = await axios.get(`${this.BIRDEYE_API_URL}/defi/v2/tokens/new_listing`, {
          params: {
            time_to: Math.floor(Date.now() / 1000),
            limit: 20,
            meme_platform_enabled: true
          },
          headers: {
            'X-API-KEY': this.BIRDEYE_API_KEY,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/37.36',
            'X-Chain': 'solana',
            'accept': 'application/json'
          },
          timeout: 15000
        });

        if (response.status !== 200 || !response.data.data || !response.data.data.items) {
          logger.warn(`Birdeye API /defi/v2/tokens/new_listing failed: ${response.statusText}`);
          logger.warn(`Response Data: ${JSON.stringify(response.data, null, 2)}`);
          retries++;
          if (retries === maxRetries) {
            logger.error('Max retries reached for Birdeye API, returning fallback tokens');
            this.lastBirdeyeFetch = now;
            return this.getFallbackTokens();
          }
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        const tokens = response.data.data.items.map(item => ({
          address: item.address,
          name: item.name || `Token_${item.address.slice(0, 8)}`,
          symbol: item.symbol || `TKN_${item.address.slice(0, 4)}`,
          createdAt: item.listing_time || new Date().toISOString(),
          solscanLink: `https://solscan.io/token/${item.address}`
        }));

        logger.info(`Fetched ${tokens.length} newly launched tokens from Birdeye API`);
        this.lastBirdeyeFetch = now;
        return tokens;
      } catch (error) {
        logger.error(`Error fetching tokens from Birdeye API: ${error.message}`);
        if (error.response) {
          logger.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        retries++;
        if (retries === maxRetries) {
          logger.error('Max retries reached for Birdeye API, returning fallback tokens');
          this.lastBirdeyeFetch = now;
          return this.getFallbackTokens();
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    this.lastBirdeyeFetch = now;
    return this.getFallbackTokens();
  }

  getFallbackTokens() {
    logger.info('Returning fallback tokens due to API failure');
    return [
      {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
        name: 'USD Coin',
        symbol: 'USDC',
        createdAt: new Date().toISOString(),
        solscanLink: 'https://solscan.io/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      }
    ];
  }

  async fetchNewlyLaunchedTokens() {
    logger.info('Resetting QuickNode usage on bot start');
    this.useQuickNode = false;
    creditUsageCount = 0;
    this.startTokenSubscription();

    if (this.useQuickNode && newlyLaunchedTokens.length > 0) {
      logger.info(`Returning ${newlyLaunchedTokens.length} newly launched tokens from QuickNode`);
      const tokensToReturn = [...newlyLaunchedTokens];
      this.clearNewlyLaunchedTokens();
      return tokensToReturn;
    }

    // Prioritize Birdeye API over DexScreener
    logger.info('Fetching tokens from Birdeye first');
    const birdeyeTokens = await this.fetchNewlyLaunchedTokensFromBirdeye();
    if (birdeyeTokens.length > 0) {
      return birdeyeTokens;
    }

    logger.info('No tokens from Birdeye, falling back to DexScreener API');
    const dexScreenerTokens = await this.fetchDexScreenerTokens();
    return dexScreenerTokens;
  }

  async clearNewlyLaunchedTokens() {
    newlyLaunchedTokens = [];
    this.tempTokenBatch = [];
    logger.info('Cleared newly launched tokens list');
  }

  async stopTokenSubscription() {
    try {
      if (this.subscriptionId !== null && this.isSubscriptionActive) {
        await this.connection.removeProgramAccountChangeListener(this.subscriptionId);
        logger.info('Unsubscribed from token mint events');
        this.subscriptionId = null;
        this.isSubscriptionActive = false;
      } else {
        logger.warn('No active subscription to stop');
      }
    } catch (error) {
      logger.error(`Error stopping WebSocket subscription: ${error.message}`);
      throw error;
    }
  }
}

const apiService = new ApiService();
apiService.initialize();

export default apiService;