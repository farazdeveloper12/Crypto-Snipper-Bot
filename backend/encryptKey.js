// backend/encryptKey.js
import { createCipheriv, randomBytes } from 'crypto';

// Replace this with your raw private key from Phantom Wallet
const rawPrivateKey = "5LbeEu5BeuGhJLGvSmXbStSwNnU9V4aMxhtDbiUo15K32BsKsmyXNnzgh59xiXWBxemEP9ppThukhpfqZxN9Fgxh"; // Aap ka Phantom wallet private key yahan daalein"; // Aap ka Phantom wallet private key yahan daalein

// 32-character encryption key
const ENCRYPTION_KEY = "bcdefghijklmnopqrstuvwxyz1234567";

// Encrypt the private key
const algorithm = 'aes-256-cbc';
const key = Buffer.from(ENCRYPTION_KEY);
const iv = randomBytes(16);
const cipher = createCipheriv(algorithm, key, iv);
let encrypted = cipher.update(rawPrivateKey, 'utf8', 'hex');
encrypted += cipher.final('hex');

// Output the encrypted key in the format iv:encrypted
const encryptedKey = `${iv.toString('hex')}:${encrypted}`;
console.log('Encrypted Private Key:', encryptedKey);