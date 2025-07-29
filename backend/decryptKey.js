// backend/decryptKey.js
import { createDecipheriv } from 'crypto';

// Aap ka encrypted key jo aap ne .env file mein set kiya hai
const encryptedKey = "c730b2d739d9463026db4667fb5c5245:5793b2ca8cf0b21cfff51181e88f8afe517400f5e4a2be2dd9326fac255f4314a34dd169cd5eb4eadd1199e1578aa6a226f31cfa39b5edf64805eca6ea6076dbb8dc4d8a29e24ed937c4caafabccc259d78e7ae3ec194ede5da8fcca6b58bae3"; // Yahan aap ka encrypted key daalein, jo .env file mein hai

// Aap ka encryption key
const ENCRYPTION_KEY = "bcdefghijklmnopqrstuvwxyz1234567";

// Decrypt the private key
const algorithm = 'aes-256-cbc';
const key = Buffer.from(ENCRYPTION_KEY);
const [ivHex, encryptedHex] = encryptedKey.split(':');
const iv = Buffer.from(ivHex, 'hex');
const encrypted = Buffer.from(encryptedHex, 'hex');

const decipher = createDecipheriv(algorithm, key, iv);
let decrypted = decipher.update(encrypted);
decrypted = Buffer.concat([decrypted, decipher.final()]);

console.log('Decrypted Private Key:', decrypted.toString());