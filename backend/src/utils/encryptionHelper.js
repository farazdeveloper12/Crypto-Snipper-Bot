// src/utils/encryptionHelper.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import encryptionConfig from '../config/encryption.js';

export const encryptKey = (privateKey) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_SECRET);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

class EncryptionHelper {
  // Generate a secure encryption key
  static generateKey() {
    return crypto.randomBytes(encryptionConfig.keyLength);
  }

  // Encrypt sensitive data
  static encrypt(data, key, iv) {
    const cipher = crypto.createCipheriv(
      encryptionConfig.algorithm, 
      key, 
      iv
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
  }

  // Decrypt sensitive data
  static decrypt(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv(
      encryptionConfig.algorithm, 
      key, 
      iv
    );

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Securely save encryption materials
  static saveEncryptionMaterials(encryptedKey, iv, key) {
    const storagePath = path.join(process.cwd(), '.wallet-secret');
    
    // Ensure strict file permissions
    const encryptionData = JSON.stringify({
      encryptedKey,
      iv: iv.toString('hex'),
      key: key.toString('hex')
    });

    fs.writeFileSync(storagePath, encryptionData, {
      mode: 0o600 // Read/write for owner only
    });
  }

  // Retrieve saved encryption materials
  static retrieveEncryptionMaterials() {
    const storagePath = path.join(process.cwd(), '.wallet-secret');
    
    try {
      const rawData = fs.readFileSync(storagePath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      throw new Error('Encryption materials not found');
    }
  }
}

export default EncryptionHelper;