// src/models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    required: true
  },
  chain: {
    type: String,
    enum: ['solana', 'ethereum', 'bsc'],
    required: true
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  totalValue: {
    type: Number,
    required: true
  },
  fees: {
    type: Number,
    default: 0
  },
  slippage: {
    type: Number,
    default: 0
  },
  txHash: {
    type: String,
    default: ''
  },
  walletAddress: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  error: {
    type: String,
    default: ''
  },
  profit: {
    type: Number,
    default: null
  },
  profitPercentage: {
    type: Number,
    default: null
  },
  exitReason: {
    type: String,
    enum: ['TAKE_PROFIT', 'STOP_LOSS', 'TRAILING_STOP', 'MANUAL', 'ERROR', ''],
    default: ''
  },
  executedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ tokenId: 1 });
transactionSchema.index({ txHash: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;