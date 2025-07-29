// backend/testQuickNode.js
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';

// Array to store newly launched token addresses
let newlyLaunchedTokens = [];
// Set to track processed mint addresses
const processedMints = new Set();
// Rate limit delay in milliseconds
const RATE_LIMIT_DELAY = 60000; // Increased to 60 seconds
const MAX_RETRIES = 2; // Max retries set to 2
const RETRY_DELAY = 10000; // Increased retry delay to 10 seconds

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchNewlyLaunchedTokens() {
  try {
    // Connect to Solana mainnet using QuickNode
    const quickNodeRpcUrl = 'https://clean-sleek-sea.solana-mainnet.quiknode.pro/8b2d195b879ceb49d31244c7a836795c19119d95/';
    const quickNodeWsUrl = 'wss://clean-sleek-sea.solana-mainnet.quiknode.pro/8b2d195b879ceb49d31244c7a836795c19119d95/';
    const connection = new Connection(quickNodeRpcUrl, 'confirmed');

    // Initialize Metaplex for metadata fetching
    const keypair = Keypair.generate();
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(keypair));

    // SPL Token Program ID
    const tokenProgramId = TOKEN_PROGRAM_ID;

    // WebSocket subscription for token mint events
    const subscriptionId = connection.onProgramAccountChange(
      tokenProgramId,
      async (keyedAccountInfo) => {
        let retries = 0;
        while (retries < MAX_RETRIES) {
          try {
            const mintAddress = keyedAccountInfo.accountId.toBase58();

            // Check if this mint address has already been processed
            if (processedMints.has(mintAddress)) {
              return;
            }

            // Add to processed set
            processedMints.add(mintAddress);

            // Fetch token metadata (optional)
            let name = `Token_${mintAddress.slice(0, 8)}`;
            let symbol = `TKN_${mintAddress.slice(0, 4)}`;
            try {
              const metadata = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(mintAddress) });
              if (metadata && metadata.name && metadata.symbol) {
                name = metadata.name.trim().replace(/\0/g, '');
                symbol = metadata.symbol.trim().replace(/\0/g, '');
              }
              // Add delay to avoid rate limiting
              await delay(RATE_LIMIT_DELAY);
            } catch (error) {
              if (error.message.includes('429')) {
                retries++;
                console.warn(`Rate limit hit for ${mintAddress}, retrying (${retries}/${MAX_RETRIES}) after ${RETRY_DELAY}ms`);
                await delay(RETRY_DELAY);
                continue;
              }
              // Suppress metadata fetch errors
            }

            // Add token to the array
            const tokenData = {
              address: mintAddress,
              name: name,
              symbol: symbol,
              createdAt: new Date().toISOString(),
              solscanLink: `https://solscan.io/token/${mintAddress}`
            };

            newlyLaunchedTokens.push(tokenData);
            break; // Success, exit retry loop
          } catch (error) {
            retries++;
            console.warn(`Error processing token mint event for ${keyedAccountInfo.accountId.toBase58()}: ${error.message}, retrying (${retries}/${MAX_RETRIES})`);
            await delay(RETRY_DELAY);
            if (retries === MAX_RETRIES) {
              console.warn(`Max retries reached for ${keyedAccountInfo.accountId.toBase58()}, skipping`);
            }
          }
        }
      },
      'confirmed',
      [
        {
          dataSize: 165 // Size of a token mint account
        }
      ]
    );

    // Keep the script running to listen for events
    await new Promise(() => {});
  } catch (error) {
    console.error(`Error setting up WebSocket subscription: ${error.message}`);
    return [];
  }
}

// Function to get the list of newly launched tokens
function getNewlyLaunchedTokens() {
  return newlyLaunchedTokens;
}

// Export the functions for use in the bot
export { fetchNewlyLaunchedTokens, getNewlyLaunchedTokens };

// Run the test
fetchNewlyLaunchedTokens()
  .catch(err => console.error('Testing failed:', err));