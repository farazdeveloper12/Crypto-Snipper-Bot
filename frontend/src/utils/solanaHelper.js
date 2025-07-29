// src/utils/solanaHelper.js

/**
 * Format a Solana public key for display
 * @param {string} publicKey - Full public key
 * @returns {string} Formatted public key (e.g., "5h4s...rap9")
 */
export const formatPublicKey = (publicKey) => {
  if (!publicKey || typeof publicKey !== 'string') return '';
  
  const start = publicKey.substring(0, 4);
  const end = publicKey.substring(publicKey.length - 4);
  
  return `${start}...${end}`;
};

/**
 * Format SOL balance
 * @param {number} solBalance - SOL balance
 * @returns {string} Formatted SOL balance
 */
export const formatSolBalance = (solBalance) => {
  if (typeof solBalance !== 'number') return '0.00';
  
  if (solBalance < 0.01) {
    return solBalance.toFixed(6);
  }
  
  return solBalance.toFixed(2);
};

/**
 * Get the estimated USD value of SOL
 * @param {number} solBalance - SOL balance
 * @param {number} solPrice - SOL price in USD
 * @returns {string} Formatted USD value
 */
export const getEstimatedUsdValue = (solBalance, solPrice = 100) => {
  if (typeof solBalance !== 'number') return '0.00';
  
  const usdValue = solBalance * solPrice;
  
  if (usdValue < 0.01) {
    return usdValue.toFixed(6);
  }
  
  return usdValue.toFixed(2);
};

/**
 * Convert lamports to SOL
 * @param {number} lamports - Amount in lamports
 * @returns {number} Amount in SOL
 */
export const lamportsToSol = (lamports) => {
  return lamports / 1_000_000_000;
};

/**
 * Convert SOL to lamports
 * @param {number} sol - Amount in SOL
 * @returns {number} Amount in lamports
 */
export const solToLamports = (sol) => {
  return sol * 1_000_000_000;
};

/**
 * Is a string a valid Solana address
 * @param {string} address - Address to validate
 * @returns {boolean} Whether the address is valid
 */
export const isValidSolanaAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  
  // Basic validation: Base58 encoding, length between 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

/**
 * Get transaction explorer URL
 * @param {string} signature - Transaction signature
 * @param {string} cluster - Solana cluster (mainnet, testnet, devnet)
 * @returns {string} Explorer URL
 */
export const getTransactionExplorerUrl = (signature, cluster = 'mainnet') => {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
};

/**
 * Get address explorer URL
 * @param {string} address - Solana address
 * @param {string} cluster - Solana cluster (mainnet, testnet, devnet)
 * @returns {string} Explorer URL
 */
export const getAddressExplorerUrl = (address, cluster = 'mainnet') => {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
};

/**
 * Get token explorer URL
 * @param {string} mintAddress - Token mint address
 * @param {string} cluster - Solana cluster (mainnet, testnet, devnet)
 * @returns {string} Explorer URL
 */
export const getTokenExplorerUrl = (mintAddress, cluster = 'mainnet') => {
  return `https://explorer.solana.com/address/${mintAddress}?cluster=${cluster}`;
};

/**
 * Generate a random transaction hash for testing
 * @returns {string} Random transaction hash
 */
export const generateRandomTxHash = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};