// scripts/encryptWallet.js
import WalletSecurityService from '../src/services/walletSecurityService.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptForPrivateKey() {
  return new Promise((resolve) => {
    rl.question('Enter your Phantom wallet private key: ', (privateKey) => {
      resolve(privateKey);
      rl.close();
    });
  });
}

async function main() {
  try {
    const privateKey = await promptForPrivateKey();
    
    // Encrypt the wallet key
    const encryptedKey = WalletSecurityService.encryptWalletKey(privateKey);
    
    console.log('Wallet key encrypted successfully');
    console.log('Encrypted key saved securely');
  } catch (error) {
    console.error('Encryption failed:', error);
  }
}

main();