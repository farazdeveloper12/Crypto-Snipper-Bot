// src/models/User.js
import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

// Define the schema
const walletAddressSchema = new mongoose.Schema({
  chain: {
    type: String,
    required: true,
    default: 'solana'
  },
  address: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: 'Default'
  },
  encryptedPrivateKey: {
    type: String,
    default: null
  }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  passwordHash: {
    type: String,
    required: true
  },
  walletAddresses: [walletAddressSchema],
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  apiKey: {
    type: String,
    default: null
  },
  encryptedApiSecret: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: Date
}, {
  timestamps: true,
  methods: {
    addWallet(chain, address, privateKey = null, label = 'Default') {
      // Check if wallet already exists
      const existingIndex = this.walletAddresses.findIndex(
        w => w.chain === chain && w.address.toLowerCase() === address.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        // Update existing wallet
        if (privateKey) {
          this.walletAddresses[existingIndex].encryptedPrivateKey = encrypt(privateKey);
        }
        
        this.walletAddresses[existingIndex].label = label;
        return existingIndex;
      }
      
      // Add new wallet
      const newWallet = {
        chain,
        address,
        label,
        encryptedPrivateKey: privateKey ? encrypt(privateKey) : null
      };
      
      this.walletAddresses.push(newWallet);
      return this.walletAddresses.length - 1;
    },

    getDecryptedPrivateKey(walletIndex) {
      if (
        walletIndex < 0 || 
        walletIndex >= this.walletAddresses.length || 
        !this.walletAddresses[walletIndex].encryptedPrivateKey
      ) {
        return null;
      }
      
      return decrypt(this.walletAddresses[walletIndex].encryptedPrivateKey);
    }
  }
});

// Compile model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;