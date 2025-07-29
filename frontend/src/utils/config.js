// frontend/src/utils/config.js - Create or update config file

export const NETWORK = 'mainnet-beta';
export const DEFAULT_RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.rpc.extrnode.com',
  'https://solana.public-rpc.com'
];

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002';
export const REFRESH_INTERVAL = 15000; // 15 seconds