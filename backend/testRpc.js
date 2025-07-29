// backend/testRpc.js
import { Connection } from '@solana/web3.js';

const RPC_URL = "https://flashy-multi-log.solana-mainnet.quiknode.pro/d4b349705070d52a9ea19e57b8f7a6ca09f25a1d/";

async function testRpc() {
  try {
    const connection = new Connection(RPC_URL, 'confirmed');
    const version = await connection.getVersion();
    console.log('RPC is working! Solana version:', version);
  } catch (error) {
    console.error('Error connecting to RPC:', error.message);
  }
}

testRpc();