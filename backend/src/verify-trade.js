// backend/src/verify-trade.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Connection, PublicKey } from '@solana/web3.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyTrade() {
  const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  const walletAddress = process.env.TRADING_WALLET_ADDRESS;
  const txId = '5nb1RxJUcDFJni1r6HM6DCT2hcqtsogRFPcwiUcNn92eDp4Eq8yqrutYMriinGR6PQdCdmUQGt3dtNaGVfZGXH8P';
  
  console.log('=== Verifying Your Trade ===\n');
  console.log(`Wallet Address: ${walletAddress}`);
  console.log(`Transaction ID: ${txId}\n`);
  
  try {
    // 1. Check current SOL balance
    const balance = await connection.getBalance(new PublicKey(walletAddress));
    const solBalance = balance / 1e9;
    console.log(`Current SOL Balance: ${solBalance.toFixed(6)} SOL`);
    
    // 2. Get transaction details
    console.log('\nFetching transaction details...');
    const tx = await connection.getTransaction(txId, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    
    if (!tx) {
      console.log('❌ Transaction not found on blockchain!');
      console.log('This might be a simulated transaction or not yet confirmed.');
      return;
    }
    
    console.log('✅ Transaction found on blockchain!');
    console.log(`Block Time: ${new Date(tx.blockTime * 1000).toLocaleString()}`);
    console.log(`Slot: ${tx.slot}`);
    console.log(`Fee: ${tx.meta.fee / 1e9} SOL`);
    
    // 3. Check if transaction was successful
    if (tx.meta.err) {
      console.log('❌ Transaction failed with error:', tx.meta.err);
      return;
    }
    
    console.log('✅ Transaction was successful!');
    
    // 4. Check balance changes
    console.log('\nBalance Changes:');
    const preBalance = tx.meta.preBalances[0] / 1e9;
    const postBalance = tx.meta.postBalances[0] / 1e9;
    const change = postBalance - preBalance;
    console.log(`Before: ${preBalance.toFixed(6)} SOL`);
    console.log(`After: ${postBalance.toFixed(6)} SOL`);
    console.log(`Change: ${change.toFixed(6)} SOL`);
    
    // 5. Check USDC balance
    console.log('\nChecking USDC Token Balance...');
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    
    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      { mint: new PublicKey(USDC_MINT) }
    );
    
    if (tokenAccounts.value.length > 0) {
      const usdcBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
      console.log(`✅ USDC Balance: ${usdcBalance.uiAmount} USDC`);
      console.log(`Token Account: ${tokenAccounts.value[0].pubkey.toString()}`);
    } else {
      console.log('❌ No USDC token account found!');
      console.log('This could mean:');
      console.log('1. The trade didn\'t execute');
      console.log('2. The token account hasn\'t been created yet');
      console.log('3. Phantom wallet needs to be refreshed');
    }
    
    // 6. Direct Solscan link
    console.log('\n📊 View on Solscan:');
    console.log(`https://solscan.io/tx/${txId}`);
    
    // 7. Check if this is a Jupiter swap
    console.log('\nChecking transaction type...');
    const instructions = tx.transaction.message.compiledInstructions || [];
    console.log(`Number of instructions: ${instructions.length}`);
    
    if (instructions.length > 3) {
      console.log('✅ This appears to be a Jupiter swap transaction');
    }
    
  } catch (error) {
    console.error('Error verifying trade:', error.message);
    console.error('\nThis could mean:');
    console.error('1. RPC connection issues');
    console.error('2. Transaction is still pending');
    console.error('3. Invalid transaction ID');
  }
}

// Add to package.json scripts: "verify-trade": "node src/verify-trade.js"
verifyTrade();