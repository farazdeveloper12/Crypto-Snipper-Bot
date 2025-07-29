// src/models/trade.js
import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  tokenAddress: {
    type: String,
    required: true
  },
  tokenSymbol: {
    type: String,
    required: true
  },
  tokenName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['buy', 'sell'],
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
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'failed'],
    default: 'open'
  },
  entryPrice: {
    type: Number
  },
  stopLoss: {
    type: Number
  },
  takeProfit: {
    type: Number
  },
  closePrice: {
    type: Number
  },
  closeTransactionId: {
    type: String
  },
  closeTimestamp: {
    type: Date
  },
  profit: {
    type: Number,
    default: 0
  },
  profitPercent: {
    type: Number,
    default: 0
  },
  closeReason: {
    type: String,
    enum: ['take_profit', 'stop_loss', 'manual', null],
    default: null
  },
  dexScreenerUrl: {
    type: String
  },
  marketCap: {
    type: Number
  },
  liquidity: {
    type: Number
  },
  volume24h: {
    type: Number
  },
  solReceived: {
    type: Number
  },
  tokenAmount: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes for performance
tradeSchema.index({ userId: 1, timestamp: -1 });
tradeSchema.index({ status: 1, userId: 1 });
tradeSchema.index({ tokenAddress: 1 });

const Trade = mongoose.model('Trade', tradeSchema);
export default Trade;