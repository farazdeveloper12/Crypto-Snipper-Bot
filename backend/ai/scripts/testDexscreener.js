// backend/ai/scripts/testDexscreener.js
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';

// List of possible endpoints to test (DexScreener + Birdeye + CoinMarketCap)
const endpoints = [
  // DexScreener Endpoints
  'https://api.dexscreener.io/latest/dex/pairs/solana',
  'https://api.dexscreener.com/latest/dex/pairs/solana',
  'https://api.dexscreener.io/latest/dex/search?q=solana',
  'https://api.dexscreener.com/latest/dex/search?q=solana',
  'https://api.dexscreener.io/latest/dex/pairs/solana?sort=pairCreatedAt&order=desc',
  'https://api.dexscreener.com/latest/dex/pairs/solana?sort=pairCreatedAt&order=desc',
  // Birdeye Endpoint
  'https://public-api.birdeye.so/defi/tokenlist?sort_by=created_timestamp&sort_type=desc&offset=0&limit=50',
  // CoinMarketCap Endpoint
  'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?sort=date_added&sort_dir=desc&limit=50'
];

// Bitquery GraphQL endpoint
const bitqueryEndpoint = 'https://graphql.bitquery.io';

// Bitquery GraphQL query for newly launched tokens
const bitqueryQuery = `
subscription {
  Solana {
    TokenMints(
      where: {Block: {Time: {since: "2025-03-26T11:13:00Z"}}}
    ) {
      Mint {
        Address
        Name
        Symbol
      }
      Block {
        Time
      }
    }
  }
}
`;

// Function to test an endpoint
const testEndpoint = async (endpoint) => {
  console.log(`Testing endpoint: ${endpoint}`);
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    // Add CoinMarketCap API key if the endpoint is CoinMarketCap
    if (endpoint.includes('coinmarketcap.com')) {
      headers['X-CMC_PRO_API_KEY'] = '0c942f9c-eced-4144-95b2-5fce19a7114b'; // Replace with your CoinMarketCap API key
    }

    const response = await axios.get(endpoint, {
      timeout: 30000,
      headers: headers
    });

    // Check if endpoint is CoinMarketCap
    if (endpoint.includes('coinmarketcap.com')) {
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log(`Success! Fetched ${response.data.data.length} tokens from CoinMarketCap`);
        
        // Filter for newly launched tokens (last 24 hours)
        const currentTime = Date.now();
        const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const newlyLaunchedTokens = response.data.data.filter(token => {
          const createdAt = token.date_added ? new Date(token.date_added).getTime() : 0;
          return (currentTime - createdAt) <= oneDayInMs;
        });

        console.log(`Found ${newlyLaunchedTokens.length} newly launched tokens (last 24 hours):`);
        newlyLaunchedTokens.forEach(token => {
          console.log(`- Token: ${token.symbol} (${token.id}) | Created At: ${token.date_added}`);
        });
      } else {
        console.log(`Unexpected response format from CoinMarketCap:`, response.data);
      }
    }
    // Check if endpoint is Birdeye
    else if (endpoint.includes('birdeye.so')) {
      if (response.data && response.data.data && Array.isArray(response.data.data.tokens)) {
        console.log(`Success! Fetched ${response.data.data.tokens.length} tokens from ${endpoint}`);
        
        // Filter for newly launched tokens (last 24 hours)
        const currentTime = Date.now();
        const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const newlyLaunchedTokens = response.data.data.tokens.filter(token => {
          const createdAt = token.created_timestamp ? new Date(token.created_timestamp).getTime() : 0;
          return (currentTime - createdAt) <= oneDayInMs;
        });

        console.log(`Found ${newlyLaunchedTokens.length} newly launched tokens (last 24 hours):`);
        newlyLaunchedTokens.forEach(token => {
          console.log(`- Token: ${token.symbol} (${token.address}) | Created At: ${token.created_timestamp}`);
        });
      } else {
        console.log(`Unexpected response format from ${endpoint}:`, response.data);
      }
    }
    // Handle DexScreener response
    else {
      if (response.data && response.data.pairs && Array.isArray(response.data.pairs)) {
        console.log(`Success! Fetched ${response.data.pairs.length} pairs from ${endpoint}`);
        
        // Filter for newly launched tokens (last 24 hours)
        const currentTime = Date.now();
        const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const newlyLaunchedPairs = response.data.pairs.filter(pair => {
          const createdAt = pair.pairCreatedAt ? new Date(pair.pairCreatedAt).getTime() : 0;
          return (currentTime - createdAt) <= oneDayInMs;
        });

        console.log(`Found ${newlyLaunchedPairs.length} newly launched pairs (last 24 hours):`);
        newlyLaunchedPairs.forEach(pair => {
          console.log(`- Token: ${pair.baseToken.symbol} (${pair.baseToken.address}) | DEX: ${pair.dexId} | Created At: ${pair.pairCreatedAt}`);
        });
      } else {
        console.log(`Unexpected response format from ${endpoint}:`, response.data);
      }
    }
  } catch (error) {
    console.error(`Error fetching from ${endpoint}: ${error.message}`);
  }
  console.log('----------------------------------------');
};

// Function to test Bitquery GraphQL endpoint
const testBitquery = async () => {
  console.log(`Testing Bitquery GraphQL endpoint: ${bitqueryEndpoint}`);
  try {
    const response = await axios.post(
      bitqueryEndpoint,
      {
        query: bitqueryQuery
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          // Add your new Bitquery API key here
          'X-API-KEY': 'ory_at_new_token_here' // Replace with your new access token
        }
      }
    );

    // Handle Bitquery response
    if (response.data && response.data.data && response.data.data.Solana && Array.isArray(response.data.data.Solana.TokenMints)) {
      console.log(`Success! Fetched ${response.data.data.Solana.TokenMints.length} tokens from Bitquery`);
      
      // Filter for newly launched tokens (last 24 hours)
      const currentTime = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const newlyLaunchedTokens = response.data.data.Solana.TokenMints.filter(token => {
        const createdAt = token.Block.Time ? new Date(token.Block.Time).getTime() : 0;
        return (currentTime - createdAt) <= oneDayInMs;
      });

      console.log(`Found ${newlyLaunchedTokens.length} newly launched tokens (last 24 hours):`);
      newlyLaunchedTokens.forEach(token => {
        console.log(`- Token: ${token.Mint.Symbol} (${token.Mint.Address}) | Created At: ${token.Block.Time}`);
      });
    } else {
      console.log(`Unexpected response format from Bitquery:`, response.data);
    }
  } catch (error) {
    console.error(`Error fetching from Bitquery: ${error.message}`);
  }
  console.log('----------------------------------------');
};

// Function to test Solana blockchain directly
const testSolanaDirect = async () => {
  console.log('Testing Solana blockchain directly for newly launched tokens...');
  try {
    // Connect to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    // SPL Token Program ID
    const tokenProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623DQ5x5');

    // Get recent program accounts (token mints)
    const accounts = await connection.getProgramAccounts(tokenProgramId, {
      filters: [
        {
          dataSize: 165 // Size of a token mint account
        }
      ]
    });

    // Filter for newly launched tokens (last 24 hours)
    const currentTime = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const newlyLaunchedTokens = [];

    for (const account of accounts) {
      // Fetch account creation time (approximate using block time)
      const signature = await connection.getSignaturesForAddress(account.pubkey, { limit: 1 });
      if (signature.length > 0) {
        const blockTime = signature[0].blockTime * 1000; // Convert to milliseconds
        if ((currentTime - blockTime) <= oneDayInMs) {
          newlyLaunchedTokens.push({
            address: account.pubkey.toBase58(),
            createdAt: new Date(blockTime).toISOString()
          });
        }
      }
    }

    console.log(`Found ${newlyLaunchedTokens.length} newly launched tokens (last 24 hours):`);
    newlyLaunchedTokens.forEach(token => {
      console.log(`- Token Address: ${token.address} | Created At: ${token.createdAt}`);
    });
  } catch (error) {
    console.error(`Error fetching from Solana blockchain: ${error.message}`);
  }
  console.log('----------------------------------------');
};

// Function to test all endpoints
const testAllEndpoints = async () => {
  // Test REST endpoints (DexScreener, Birdeye, CoinMarketCap)
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test Bitquery GraphQL endpoint
  await testBitquery();

  // Test Solana blockchain directly
  await testSolanaDirect();
};

// Run the test
console.log('Starting API endpoint testing...');
testAllEndpoints()
  .then(() => console.log('Testing completed!'))
  .catch(err => console.error('Testing failed:', err));