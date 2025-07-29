// backend/testPublicKey.js
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// Aap ka decrypted private key jo decryptKey.js se mila
const privateKeyString = "5LbeEu5BeuGhJLGvSmXbStSwNnU9V4aMxhtDbiUo15K32BsKsmyXNnzgh59xiXWBxemEP9ppThukhpfqZxN9Fgxh"; // Yahan aap ka decrypted private key daalein

try {
  // Decode private key (assuming it's in base58 format)
  const privateKeyBytes = bs58.decode(privateKeyString);
  
  // Validate private key length
  if (privateKeyBytes.length !== 64) {
    throw new Error(`Invalid private key length: ${privateKeyBytes.length}. Expected 64 bytes.`);
  }

  // Generate keypair from private key
  const keypair = Keypair.fromSecretKey(privateKeyBytes);
  
  // Get public key
  const publicKey = keypair.publicKey.toBase58();
  
  console.log('Public Key:', publicKey);
  
  // Verify if public key matches your wallet address
  const expectedPublicKey = "5h4sVsNhuxcqtaWP1XUTPUwQdDEbuuXBeN27fGgirap9";
  if (publicKey === expectedPublicKey) {
    console.log('Public key matches expected wallet address!');
  } else {
    console.log('Public key does NOT match expected wallet address.');
    console.log('Expected:', expectedPublicKey);
  }
} catch (error) {
  console.error('Error generating public key:', error.message);
}