// src/models/Wallet.js
import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  chain: { type: String, default: 'solana' },
}, { timestamps: true });

export default mongoose.model('Wallet', WalletSchema);
