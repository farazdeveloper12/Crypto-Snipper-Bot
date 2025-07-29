// backend/src/check-env.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple paths to find .env
const possiblePaths = [
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env'),
  path.join(process.cwd(), '.env'),
  '.env'
];

console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);
console.log('\nChecking for .env file in these locations:');

let envPath = null;
for (const p of possiblePaths) {
  console.log(`- ${p}: ${fs.existsSync(p) ? '✅ FOUND' : '❌ NOT FOUND'}`);
  if (fs.existsSync(p) && !envPath) {
    envPath = p;
  }
}

if (envPath) {
  console.log(`\nLoading .env from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('\n❌ No .env file found!');
  process.exit(1);
}

console.log('\nEnvironment Variables Check:');
console.log('============================');

// Check critical variables
const checks = [
  { name: 'WALLET_PRIVATE_KEY', critical: true },
  { name: 'TRADING_WALLET_ADDRESS', critical: true },
  { name: 'SOLANA_RPC_URL', critical: true },
  { name: 'BIRDEYE_API_KEY', critical: false },
  { name: 'PORT', critical: false }
];

let hasErrors = false;

for (const check of checks) {
  const value = process.env[check.name];
  if (value) {
    if (check.name === 'WALLET_PRIVATE_KEY') {
      // Don't show the full private key for security
      console.log(`✅ ${check.name}: ${value.substring(0, 10)}...${value.substring(value.length - 10)}`);
    } else {
      console.log(`✅ ${check.name}: ${value}`);
    }
  } else {
    console.log(`${check.critical ? '❌' : '⚠️'} ${check.name}: NOT SET`);
    if (check.critical) hasErrors = true;
  }
}

if (hasErrors) {
  console.log('\n❌ Critical environment variables are missing!');
  console.log('\nMake sure your .env file contains:');
  console.log('WALLET_PRIVATE_KEY=your-actual-private-key-here');
  console.log('(Replace "your-actual-private-key-here" with your real private key)');
} else {
  console.log('\n✅ All critical environment variables are set!');
  
  // Try to decode the private key
  try {
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (privateKey === 'WALLET_PRIVATE_KEY' || privateKey === 'your-actual-private-key-here') {
      console.log('\n⚠️ WARNING: You haven\'t replaced the placeholder private key!');
      console.log('Edit your .env file and replace WALLET_PRIVATE_KEY with your actual private key.');
    } else {
      console.log('\n✅ Private key appears to be set correctly.');
    }
  } catch (error) {
    console.log('\n❌ Error checking private key:', error.message);
  }
}

process.exit(hasErrors ? 1 : 0);