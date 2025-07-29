// src/utils/encryption.js
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

// Get encryption key from environment or generate a default
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_very_long_secret_key_that_is_at_least_32_characters';

export const encrypt = (data) => {
  try {
    // Ensure data is a string
    const dataString = typeof data === 'object' 
      ? JSON.stringify(data) 
      : String(data);
    
    // Encrypt
    const encrypted = CryptoJS.AES.encrypt(
      dataString, 
      ENCRYPTION_KEY
    ).toString();
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

export const decrypt = (encryptedData) => {
  try {
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData, 
      ENCRYPTION_KEY
    ).toString(CryptoJS.enc.Utf8);
    
    try {
      // Try to parse as JSON if it's an object
      return JSON.parse(decrypted);
    } catch {
      // If not JSON, return as string
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};