// encryptPrivateKey.js
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = 'your_32_char_encryption_key_here'; // Same as ENCRYPTION_KEY in .env
const iv = crypto.randomBytes(16);

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

const privateKey = '5LbeEu5BeuGhJLGvSmXbStSwNnU9V4aMxhtDbiUo15K32BsKsmyXNnzgh59xiXWBxemEP9ppThukhpfqZxN9Fgxh'; // Replace with your actual private key
const encryptedKey = encrypt(privateKey);
console.log('Encrypted Private Key:', encryptedKey);