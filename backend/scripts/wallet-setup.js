// scripts/wallet-setup.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

class WalletSetup {
  static async encryptPrivateKey() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve, reject) => {
      rl.question('Enter your Solana wallet private key: ', (privateKey) => {
        try {
          // Generate encryption key and IV
          const encryptionKey = crypto.randomBytes(32);
          const iv = crypto.randomBytes(16);

          // Encrypt the private key
          const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
          let encrypted = cipher.update(privateKey, 'utf8', 'hex');
          encrypted += cipher.final('hex');

          // Prepare encryption materials
          const encryptionMaterials = {
            encryptedKey: encrypted,
            iv: iv.toString('hex'),
            key: encryptionKey.toString('hex')
          };

          // Secure file path
          const securePath = path.join(__dirname, '..', '.wallet-secret');

          // Write with restricted permissions
          fs.writeFileSync(securePath, JSON.stringify(encryptionMaterials), {
            mode: 0o600 // Read/write for owner only
          });

          console.log('Wallet key encrypted and stored securely');
          rl.close();
          resolve(encryptionMaterials);
        } catch (error) {
          console.error('Encryption failed:', error);
          rl.close();
          reject(error);
        }
      });
    });
  }

  static decryptPrivateKey() {
    try {
      const securePath = path.join(__dirname, '..', '.wallet-secret');
      const encryptionMaterials = JSON.parse(fs.readFileSync(securePath, 'utf8'));

      const decipher = crypto.createDecipheriv(
        'aes-256-cbc', 
        Buffer.from(encryptionMaterials.key, 'hex'),
        Buffer.from(encryptionMaterials.iv, 'hex')
      );

      let decrypted = decipher.update(encryptionMaterials.encryptedKey, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }
}

// Run encryption if script is called directly
if (require.main === module) {
  WalletSetup.encryptPrivateKey()
    .then(materials => {
      // Update .env file
      const dotenv = require('dotenv');
      const path = require('path');
      const fs = require('fs');

      const envPath = path.join(__dirname, '..', '.env');
      const envConfig = dotenv.parse(fs.readFileSync(envPath));

      envConfig.ENCRYPTED_WALLET_KEY = materials.encryptedKey;
      envConfig.WALLET_ENCRYPTION_IV = materials.iv;
      envConfig.WALLET_ENCRYPTION_KEY = materials.key;

      const envContents = Object.keys(envConfig)
        .map(key => `${key}=${envConfig[key]}`)
        .join('\n');

      fs.writeFileSync(envPath, envContents);
      console.log('.env file updated with encryption details');
    })
    .catch(console.error);
}

export default WalletSetup;