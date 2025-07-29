// src/services/walletSecurityService.js
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import EncryptionHelper from '../utils/encryptionHelper.js';
import logger from '../utils/logger.js';

class WalletSecurityService {
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
  }

  // Encrypt Phantom wallet private key
  encryptWalletKey(privateKey) {
    try {
      // Validate private key
      this.validatePrivateKey(privateKey);

      // Generate encryption materials
      const key = EncryptionHelper.generateKey();
      const iv = crypto.randomBytes(16);

      // Encrypt the private key
      const encryptedKey = EncryptionHelper.encrypt(privateKey, key, iv);

      // Securely save encryption materials
      EncryptionHelper.saveEncryptionMaterials(encryptedKey, iv, key);

      return encryptedKey;
    } catch (error) {
      logger.error('Wallet key encryption failed', error);
      throw error;
    }
  }

  // Decrypt wallet private key
  decryptWalletKey() {
    try {
      // Retrieve encryption materials
      const { encryptedKey, iv, key } = EncryptionHelper.retrieveEncryptionMaterials();

      // Decrypt the private key
      const decryptedKey = EncryptionHelper.decrypt(
        encryptedKey, 
        Buffer.from(key, 'hex'), 
        Buffer.from(iv, 'hex')
      );

      return decryptedKey;
    } catch (error) {
      logger.error('Wallet key decryption failed', error);
      throw error;
    }
  }

  // Validate Phantom wallet private key
  validatePrivateKey(privateKey) {
    if (!privateKey) throw new Error('Private key is required');
    
    try {
      // Attempt to create keypair to validate
      Keypair.fromSecretKey(bs58.decode(privateKey));
    } catch (error) {
      throw new Error('Invalid Phantom wallet private key');
    }
  }

  // Get wallet balance
  async getWalletBalance(privateKey) {
    try {
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      const balance = await this.connection.getBalance(keypair.publicKey);
      return balance / 10**9; // Convert lamports to SOL
    } catch (error) {
      logger.error('Balance retrieval failed', error);
      return 0;
    }
  }
}

export default new WalletSecurityService();